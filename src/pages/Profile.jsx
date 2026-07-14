import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMyBBAuth } from "@/lib/MyBBAuthContext";
import { Radio, Star, Award, MessageSquare, LogOut, Edit, Save, X, Plus, Trash2, UserPlus, Shield, Camera, Loader2, Trophy, BarChart3, ChevronRight } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import LevelBar from '@/components/achievements/LevelBar';
import TrophyCase from '@/components/achievements/TrophyCase';
import StatsGrid from '@/components/achievements/StatsGrid';
import { RARITY_SCORES } from '@/lib/rarityConfig';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

export default function Profile() {
  const { mybbUser, login, logout: mybbLogout } = useMyBBAuth();
  const { isAdmin } = useAdminAccess();
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [newRadio, setNewRadio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

  const { data: userStats = {} } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const res = await base44.functions.invoke('syncUserStats', { uid: mybbUser?.uid });
      return res.data?.stats || {};
    },
    enabled: !!mybbUser?.uid,
    staleTime: 30000,
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['profile-achievements'],
    queryFn: async () => await base44.entities.UserAchievement.list(),
    staleTime: 15000,
  });

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

  // Resize image to 100x100 on canvas and return base64
  const resizeImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      // Cover crop: center the image
      const scale = Math.max(100 / img.width, 100 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (100 - w) / 2, (100 - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.src = url;
  });

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file);
    setAvatarPreview(dataUrl);
    setAvatarFile({ dataUrl, name: file.name });
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !mybbUser) return;
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const base64 = avatarFile.dataUrl.split(",")[1];
      const res = await base44.functions.invoke("uploadAvatar", {
        fileBase64: base64,
        fileName: "avatar.jpg",
        mimeType: "image/jpeg",
        username: mybbUser.username,
        uid: mybbUser.uid,
      });
      if (res.data?.success) {
        const newAvatarUrl = res.data.avatar_url;
        // Update session with new avatar URL
        login({ ...mybbUser, avatar: newAvatarUrl });
        setAvatarPreview(null);
        setAvatarFile(null);
      } else {
        setAvatarError(res.data?.error || "Upload failed");
      }
    } catch (e) {
      setAvatarError("Upload failed: " + e.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const callsign = user?.callsign || mybbUser?.username || "MIST Member";

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
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl border-2 border-violet-500/40 bg-violet-950/50 overflow-hidden flex items-center justify-center shadow-lg shadow-violet-900/30">
              {avatarPreview ? (
                <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
              ) : mybbUser?.avatar ? (
                <img src={mybbUser.avatar} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.onerror=null; e.target.src=LOGO_URL; }} />
              ) : (
                <img src={LOGO_URL} alt="avatar" className="w-full h-full object-contain scale-110" />
              )}
            </div>
            {/* Camera button overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-violet-600 border-2 border-background flex items-center justify-center hover:bg-violet-500 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
          </div>
          {/* Avatar upload controls */}
          {avatarPreview && (
            <div className="flex items-center gap-2 mb-2">
              <Button size="sm" onClick={handleAvatarUpload} disabled={uploadingAvatar} className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-7 px-3">
                {uploadingAvatar ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Uploading...</> : "Save Avatar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }} className="text-xs h-7 text-muted-foreground">
                Cancel
              </Button>
            </div>
          )}
          {avatarError && <p className="text-xs text-red-400 mb-1">{avatarError}</p>}
          <h2 className="text-xl font-bold text-foreground">{callsign}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{user?.location || "GMRS Community"} · GMRS Operator</p>
          {mybbUser?.role && (
            <div className={`mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              mybbUser.role === "admin" ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
              : mybbUser.role === "moderator" ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
              : "bg-white/[0.05] text-muted-foreground border border-white/[0.08]"
            }`}>
              <Shield className="w-3 h-3" />
              {mybbUser.role.charAt(0).toUpperCase() + mybbUser.role.slice(1)}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Star, label: "Reputation", value: mybbUser?.reputation ?? 0 },
            { icon: MessageSquare, label: "Posts", value: mybbUser?.postcount ?? 0 },
            { icon: Award, label: "Threads", value: mybbUser?.threadcount ?? 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center py-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <span className="text-2xl font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground mt-1">{label}</span>
            </div>
          ))}
        </div>

        {/* Level & XP */}
        <LevelBar xp={userStats.xp || 0} />

        {/* Achievement Links */}
        <div className="flex gap-2">
          <Link to="/achievements" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
            <Trophy className="w-4 h-4" /> {userAchievements.length} Achievements
          </Link>
          <Link to="/leaderboard" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium">
            <BarChart3 className="w-4 h-4" /> Leaderboard
          </Link>
        </div>

        {/* Trophy Case */}
        <TrophyCase achievements={userAchievements} onBadgeClick={() => {}} />

        {/* Lifetime Statistics */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Lifetime Statistics</h3>
          <StatsGrid stats={userStats} />
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

        {/* Admin Access */}
        {isAdmin && (
          <Link
            to="/platform/admin"
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-warning/10 to-primary/10 border border-warning/20 hover:border-warning/40 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Admin Control Center</p>
              <p className="text-xs text-muted-foreground">Manage users, content, and platform settings</p>
            </div>
            <ChevronRight className="w-5 h-5 text-warning" />
          </Link>
        )}

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => { mybbLogout(); window.location.href = "/login"; }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}