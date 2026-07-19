import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * migrateMyBBAccounts — maps legacy MyBB accounts onto MIST users.
 *
 * Admin-only. Fetches the MyBB user list from the trusted bridge, matches each
 * to a MIST user by email, and records the result in AccountMigration. Duplicate
 * or unmatched accounts are flagged as conflicts for administrator review —
 * nothing is overwritten. Runs in dry_run by default; pass dry_run:false to
 * persist migrated records. Returns a full migration report.
 *
 * Backward compatible + rollback: every persisted record carries a migration_batch
 * id; deleting records for a batch fully rolls back the mapping (MyBB data itself
 * is never modified — only the MIST-side linkage is recorded).
 */

const BRIDGE_URL = "https://insomniacsgmrs.com/mist-sso.php";
const SECRET = Deno.env.get("MIST_BRIDGE_SECRET") || "";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Admin-only
    const roles = await base44.asServiceRole.entities.PlatformRole.filter({
      user_id: user.id,
      is_active: true
    });
    const roleStrings = (roles || []).map((r) => r.role);
    const isAdmin =
      roleStrings.includes("platform_owner") ||
      roleStrings.includes("platform_admin") ||
      user.role === "admin";
    if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;
    const batchId = body.batch_id || `batch-${Date.now()}`;

    // 1. Fetch legacy MyBB users from the bridge (secret-protected).
    let mybbUsers = [];
    try {
      const res = await fetch(BRIDGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Mist-Secret": SECRET },
        body: JSON.stringify({ action: "list_users" })
      });
      const data = await res.json().catch(() => null);
      if (!data || !data.success) {
        return Response.json(
          { error: data?.error || "Bridge list_users action unavailable", bridge_status: res.status },
          { status: 502 }
        );
      }
      mybbUsers = data.users || [];
    } catch (e) {
      return Response.json({ error: "Bridge unreachable: " + e.message }, { status: 502 });
    }

    // 2. Load MIST users to match by email.
    let mistUsers = [];
    try {
      mistUsers = await base44.asServiceRole.entities.User.list("-created_date", 1000);
    } catch (e) {
      return Response.json({ error: "Unable to list MIST users: " + e.message }, { status: 500 });
    }
    const mistByEmail = {};
    for (const u of mistUsers) {
      if (u.email) mistByEmail[String(u.email).toLowerCase()] = u;
    }

    // 3. Load existing migrations to avoid re-mapping / detect duplicates.
    const existing = await base44.asServiceRole.entities.AccountMigration.list("-created_date", 1000);
    const mappedMybbUid = {};
    const mappedMistId = {};
    for (const m of existing) {
      if (m.status === "migrated" || m.status === "resolved") {
        mappedMybbUid[String(m.mybb_uid)] = m;
        if (m.mist_user_id) mappedMistId[m.mist_user_id] = m;
      }
    }

    const report = {
      batch_id: batchId,
      dry_run: dryRun,
      total: mybbUsers.length,
      migrated: 0,
      conflicts: 0,
      skipped: 0,
      errors: 0,
      records: []
    };

    for (const mu of mybbUsers) {
      const uid = String(mu.uid);
      const preserved = JSON.stringify({
        postcount: mu.postcount || 0,
        reputation: mu.reputation || 0,
        threadcount: mu.threadcount || 0,
        usergroup: mu.usergroup || null,
        avatar: mu.avatar || null,
        additionalgroups: mu.additionalgroups || ""
      });

      const rec = {
        mybb_uid: uid,
        mybb_username: mu.username,
        mybb_email: mu.email || "",
        mist_user_id: null,
        mist_email: "",
        status: "skipped",
        conflict_reason: "",
        preserved_data: preserved
      };

      if (mappedMybbUid[uid]) {
        rec.status = "skipped";
        rec.conflict_reason = "Already migrated in a prior batch";
        report.skipped++;
      } else {
        const match = mu.email ? mistByEmail[String(mu.email).toLowerCase()] : null;
        if (match) {
          if (mappedMistId[match.id]) {
            rec.status = "conflict";
            rec.conflict_reason = "MIST user already linked to a different MyBB account";
            report.conflicts++;
          } else {
            rec.status = "migrated";
            rec.mist_user_id = match.id;
            rec.mist_email = match.email;
            mappedMybbUid[uid] = rec;
            mappedMistId[match.id] = rec;
            report.migrated++;
          }
        } else {
          rec.status = "conflict";
          rec.conflict_reason = "No matching MIST account by email — invite/register the user first";
          report.conflicts++;
        }
      }

      report.records.push(rec);

      if (!dryRun && rec.status === "migrated") {
        try {
          await base44.asServiceRole.entities.AccountMigration.create({
            mybb_uid: rec.mybb_uid,
            mybb_username: rec.mybb_username,
            mybb_email: rec.mybb_email,
            mist_user_id: rec.mist_user_id,
            mist_email: rec.mist_email,
            status: "migrated",
            preserved_data: rec.preserved_data,
            migration_batch: batchId,
            migrated_at: new Date().toISOString()
          });
        } catch (e) {
          report.errors++;
          rec.status = "error";
          rec.conflict_reason = e.message;
        }
      }
    }

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});