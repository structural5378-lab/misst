import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Radio, Star, Award, MessageSquare, LogOut, Edit, Save, X, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [newRadio, setNewRadio] = useState("");

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setForm({
        callsign: u?.callsign || "",
        location: u?.location || "",
        bio: u?.bio || "",
        radios: u?.radios || [],
        mybb_username: u?.mybb_username || "",
      });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    const updated = await base44.auth.me();
    setUser(updated);
    setEditing(false);
    setSaving(false);
  };

  const addRadio = () => {
    if (!newRadio.trim()) return;
    setForm((f) => ({ ...f, radios: [...(f.radios || []), newRadio.trim()] }));
    setNewRadio("");
  };

  const removeRadio = (i) => {
    setForm((f) => ({ ...f, radios: f.radios.filter((_, idx) => idx !== i) }));
  };

  const callsign = user?.callsign || "MIST Member";

  return (
    <div>
      <PageHeader
        title="Profile"
        showBack
        rightAction={
          editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3">
                {saving ? "Saving..." : <><Save className="w-3 h-3 mr-1" />Save</>}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-violet-400">
              <Edit className="w-4 h-4" />
            </Button>
          )
        }
      />

      <div className="px-4 pt-4 space-y-4 pb-6">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-20 h-20 rounded-2xl border-2 border-violet-500/40 bg-violet-950/50 overflow-hidden flex items-center justify-center mb-3 shadow-lg shadow-violet-900/30">
            <img src={LOGO_URL} alt="avatar" className="w-full h-full object-contain scale-110" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{callsign}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.location || "GMRS Community"} · GMRS Operator</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Star, label: "Reputation", value: user?.reputation || 0 },
            { icon: Award, label: "Badges", value: user?.badges || 0 },
            { icon: MessageSquare, label: "Threads", value: user?.forum_count || 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center py-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <span className="text-2xl font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground mt-1">{label}</span>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        {editing ? (
          <div className="space-y-4 p-4 rounded-xl bg-white/[0.03] border border-violet-500/20">
            <h3 className="text-sm font-semibold text-foreground">Edit Profile</h3>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">GMRS Callsign</Label>
              <Input
                placeholder="e.g. WSEU790"
                value={form.callsign}
                onChange={(e) => setForm((f) => ({ ...f, callsign: e.target.value.toUpperCase() }))}
                className="h-10 bg-background/50 uppercase"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input
                placeholder="City, State"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="h-10 bg-background/50"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bio</Label>
              <Input
                placeholder="Short bio..."
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                className="h-10 bg-background/50"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Forum Username</Label>
              <Input
                placeholder="Your insomniacsgmrs.com username"
                value={form.mybb_username}
                onChange={(e) => setForm((f) => ({ ...f, mybb_username: e.target.value }))}
                className="h-10 bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Radio Equipment</Label>
              {(form.radios || []).map((radio, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-foreground bg-background/50 rounded-lg px-3 py-2 border border-border/50">{radio}</span>
                  <button onClick={() => removeRadio(i)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add radio (e.g. Motorola XPR 5550)"
                  value={newRadio}
                  onChange={(e) => setNewRadio(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRadio()}
                  className="h-9 bg-background/50 text-sm"
                />
                <Button size="sm" variant="outline" onClick={addRadio} className="border-violet-500/30 text-violet-400">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* About Me */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <h3 className="text-sm font-semibold text-foreground mb-2">About Me</h3>
              <p className="text-sm text-muted-foreground">{user?.bio || "No bio yet — tap edit to add one."}</p>
            </div>

            {/* Radio Setup */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <h3 className="text-sm font-semibold text-foreground mb-2">Radio Setup</h3>
              {(user?.radios?.length > 0) ? (
                <ul className="space-y-1.5">
                  {user.radios.map((radio, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Radio className="w-3 h-3 text-violet-400 shrink-0" />
                      {radio}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No radios listed yet.</p>
              )}
            </div>

            {/* Forum Link */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <h3 className="text-sm font-semibold text-foreground mb-2">Forum Account</h3>
              {user?.mybb_username ? (
                <a
                  href={`https://insomniacsgmrs.com/member.php?action=profile&username=${user.mybb_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-violet-400 hover:underline"
                >
                  {user.mybb_username} on insomniacsgmrs.com →
                </a>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">No forum account linked yet.</p>
                  <Link to="/community-forum/register" className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg">
                    <UserPlus className="w-3.5 h-3.5" /> Register for the Forum
                  </Link>
                </div>
              )}
            </div>

            {/* Member Since */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <h3 className="text-sm font-semibold text-foreground mb-1">Member Since</h3>
              <p className="text-sm text-muted-foreground">
                {user?.created_date ? new Date(user.created_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
              </p>
            </div>
          </>
        )}

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => base44.auth.logout("/")}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}