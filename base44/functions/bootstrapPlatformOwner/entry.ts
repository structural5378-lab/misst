import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// One-time bootstrap: the first authenticated user to call this becomes platform_owner.
// If a platform_owner already exists, this function rejects.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if any platform_owner already exists
    const existingOwners = await base44.asServiceRole.entities.PlatformRole.filter({
      role: 'platform_owner',
      is_active: true
    });

    if (existingOwners && existingOwners.length > 0) {
      return Response.json({
        error: 'A platform owner already exists. Use assignPlatformRole to grant additional platform roles.',
        existing_owner_email: existingOwners[0].user_email
      }, { status: 409 });
    }

    // Create the first platform_owner
    const role = await base44.asServiceRole.entities.PlatformRole.create({
      user_id: user.id,
      user_email: user.email,
      role: 'platform_owner',
      assigned_by: user.id,
      assigned_by_email: user.email,
      is_active: true
    });

    return Response.json({
      success: true,
      message: 'You are now the platform owner.',
      role
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});