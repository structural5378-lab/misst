import { useState } from "react";
import { useMistUser } from "@/hooks/useMistUser";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { SectionCard } from "../ui";
import { Download, Trash2, Pause, ShieldAlert, Check } from "lucide-react";

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AccountData() {
  const { user, updateProfile } = useMistUser();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivated, setDeactivated] = useState(false);
  const [deleteType, setDeleteType] = useState("");

  const exportData = async () => {
    setExporting(true);
    try {
      const [threads, posts, stats] = await Promise.allSettled([
        base44.entities.ForumThread.filter({ author_id: user.id }),
        base44.entities.ForumPost.filter({ author_id: user.id }),
        base44.entities.UserStats.filter({ user_id: user.id }),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        profile: user,
        stats: stats.status === "fulfilled" ? stats.value?.[0] : null,
        threads: threads.status === "fulfilled" ? threads.value : [],
        posts: posts.status === "fulfilled" ? posts.value : [],
      };
      download(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), "mist-account-data.json");
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch {} finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteType !== "DELETE") return;
    await updateProfile({ account_deletion_requested: true });
    setDeleteOpen(false);
  };

  const deactivate = async () => {
    await updateProfile({ account_status: "deactivated" });
    setDeactivated(true);
    setDeactivateOpen(false);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Export Account Data" desc="Download a copy of your MIST data." icon={Download}
        footer={
          <div className="flex justify-end items-center gap-2">
            {exported && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Downloaded</span>}
            <Button onClick={exportData} disabled={exporting}>{exporting ? "Exporting…" : (<><Download className="w-4 h-4" /> Export data</>)}</Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">We'll compile your profile, stats, threads, and replies into a JSON file you can download immediately.</p>
      </SectionCard>

      <SectionCard title="Deactivate Account" desc="Temporarily disable your account." icon={Pause}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDeactivateOpen(true)} disabled={deactivated}>
              {deactivated ? "Deactivated" : "Deactivate account"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">Deactivating hides your profile and pauses your activity. You can reactivate by signing in again.</p>
        {deactivated && <p className="text-xs text-amber-400 mt-2">Your account is currently marked deactivated.</p>}
      </SectionCard>

      <SectionCard title="Delete Account" desc="Permanently remove your account." icon={Trash2}
        footer={
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="w-4 h-4" /> Delete account</Button>
          </div>
        }
      >
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">This is permanent. Your deletion request will be queued and reviewed. Full removal of all data is completed by Base44 support to comply with data protection requirements.</p>
        </div>
      </SectionCard>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>This action is irreversible. Type <b>DELETE</b> to confirm. We'll submit your request for permanent removal.</DialogDescription>
          </DialogHeader>
          <input
            value={deleteType}
            onChange={(e) => setDeleteType(e.target.value)}
            placeholder="DELETE"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteType !== "DELETE"}>Request deletion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deactivate account?</DialogTitle><DialogDescription>Your profile will be hidden and activity paused until you sign back in.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button onClick={deactivate}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}