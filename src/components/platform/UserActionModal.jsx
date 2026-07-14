import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Ban, CircleSlash, BadgeCheck, ShieldOff, ShieldCheck, RotateCcw, Award, ImageOff, Edit, Save, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UserActionModal({ user, onClose, onAction }) {
  const [loading, setLoading] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    callsign: user.callsign || "",
    location: user.location || "",
    bio: user.bio || "",
    mybb_username: user.mybb_username || "",
  });

  const act = async (action, extra = {}) => {
    setLoading(action);
    try {
      await base44.functions.invoke("adminManageUser", { action, target_user_id: user.id, ...extra });
      onAction();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const saveProfile = async () => {
    setLoading("update_profile");
    try {
      await base44.functions.invoke("adminManageUser", { action: "update_profile", target_user_id: user.id, fields: form });
      onAction();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    { key: "suspend", label: user.is_platform_suspended ? "Unsuspend" : "Suspend", icon: user.is_platform_suspended ? ShieldCheck : ShieldOff, color: "amber", act: () => act(user.is_platform_suspended ? "unsuspend" : "suspend") },
    { key: "ban", label: user.is_banned ? "Unban" : "Ban", icon: Ban, color: "rose", act: () => act(user.is_banned ? "unban" : "ban") },
    { key: "mute", label: user.is_muted ? "Unmute" : "Mute", icon: CircleSlash, color: "blue", act: () => act(user.is_muted ? "unmute" : "mute") },
    { key: "verify", label: user.is_verified ? "Unverify" : "Verify", icon: BadgeCheck, color: "emerald", act: () => act(user.is_verified ? "unverify" : "verify") },
    { key: "reset_reputation", label: "Reset Reputation", icon: RotateCcw, color: "violet", act: () => act("reset_reputation") },
    { key: "reset_badges", label: "Reset Badges", icon: Award, color: "violet", act: () => act("reset_badges") },
    { key: "reset_avatar", label: "Reset Avatar", icon: ImageOff, color: "violet", act: () => act("reset_avatar") },
    { key: "set_role", label: user.role === "admin" ? "Demote to User" : "Promote to Admin", icon: UserCog, color: "amber", act: () => act("set_role", { fields: { role: user.role === "admin" ? "user" : "admin" } }) },
  ];

  const colorClasses = {
    amber: "border-amber-500/30 text-amber-400 hover:bg-amber-500/10",
    rose: "border-rose-500/30 text-rose-400 hover:bg-rose-500/10",
    blue: "border-blue-500/30 text-blue-400 hover:bg-blue-500/10",
    emerald: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
    violet: "border-violet-500/30 text-violet-400 hover:bg-violet-500/10",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/15 flex items-center justify-center text-sm font-bold text-violet-400">
              {(user.callsign || user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{user.full_name || user.callsign || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {user.is_banned && <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">Banned</span>}
            {user.is_platform_suspended && <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">Suspended</span>}
            {user.is_muted && <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">Muted</span>}
            {user.is_verified && <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Verified</span>}
            <span className={`text-xs px-2.5 py-1 rounded-full border ${user.role === "admin" ? "bg-amber-500/15 text-amber-400 border-amber-500/25" : "bg-white/[0.05] text-muted-foreground border-white/[0.08]"}`}>
              {user.role || "user"}
            </span>
          </div>

          {/* Edit profile */}
          {editing ? (
            <div className="space-y-3 p-4 rounded-xl bg-background/50 border border-border">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Callsign</Label>
                <Input value={form.callsign} onChange={e => setForm(f => ({ ...f, callsign: e.target.value }))} className="h-9 bg-background" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="h-9 bg-background" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Bio</Label>
                <Input value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="h-9 bg-background" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Forum Username</Label>
                <Input value={form.mybb_username} onChange={e => setForm(f => ({ ...f, mybb_username: e.target.value }))} className="h-9 bg-background" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveProfile} disabled={loading === "update_profile"} className="bg-violet-600 hover:bg-violet-700 text-white">
                  {loading === "update_profile" ? "Saving..." : <><Save className="w-3 h-3 mr-1" />Save</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="w-full flex items-center gap-2 p-3 rounded-xl bg-background/50 border border-border hover:border-violet-500/30 transition-colors text-sm text-violet-400">
              <Edit className="w-4 h-4" /> Edit Profile Information
            </button>
          )}

          {/* Quick actions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {actions.map(a => (
                <button
                  key={a.key}
                  onClick={a.act}
                  disabled={loading === a.key || loading === "update_profile"}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-50 ${colorClasses[a.color]}`}
                >
                  <a.icon className="w-4 h-4" />
                  {loading === a.key ? "..." : a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}