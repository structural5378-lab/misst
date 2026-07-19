import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Trophy, ChevronRight, Shield, Save, X, Camera, Loader2, Plus, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/layout/PageHeader";
import ProfileHeader from "@/components/profile/ProfileHeader";
import {
  Section, ProfileStats, ProfileEquipment, ProfileClubs,
  ProfileRecentThreads, ProfileRecentReplies, ProfileBookmarks,
  ProfileMediaGallery, ProfileTimeline,
} from "@/components/profile/ProfileSections";
import StatsGrid from "@/components/achievements/StatsGrid";
import TrophyCase from "@/components/achievements/TrophyCase";
import BadgeShowcase from "@/components/profile/BadgeShowcase";
import { deriveGroups, deriveBadges, selectBanner, getAvatarFrame } from "@/lib/profileConfig";

const LOGO_URL = "https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png";

function safeArr(v) { if (!v) return []; if (Array.isArray(v)) return v; try { return JSON.parse(v); } catch { return []; } }

export default function OperatorProfile() {
  const [params] = useSearchParams();
  const { user, mistUser, mybbUser, login, updateProfile, signOut } = useMistUser();
  const { isAdmin } = useAdminAccess();
  const targetId = params.get("user");
  const isSelf = !targetId || (user && targetId === user.id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [newRadio, setNewRadio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isSelf && user) {
      setForm({
        callsign: user.callsign || "",
        location: user.location || "",
        bio: user.bio || "",
        radios: user.radios || [],
        mybb_username: user.mybb_username || "",
      });
    }
  }, [user, isSelf]);

  const { data: stats = {} } = useQuery({
    queryKey: ["profile-stats", isSelf ? "me" : targetId],
    queryFn: async () => {
      if (isSelf && mybbUser?.uid) { const res = await base44.functions.invoke("syncUserStats", { uid: mybbUser.uid }); return res.data?.stats || {}; }
      const list = await base44.entities.UserStats.filter({ user_id: targetId });
      return list?.[0] || {};
    },
    enabled: isSelf ? !!mybbUser?.uid : !!targetId,
    staleTime: 30000,
  });
  const { data: otherProfile } = useQuery({
    queryKey: ["profile-user", targetId],
    queryFn: () => base44.entities.User.get(targetId),
    enabled: !isSelf && !!targetId,
    staleTime: 60000,
  });
  const { data: achievements = [] } = useQuery({
    queryKey: ["profile-ach", isSelf ? "me" : targetId],
    queryFn: () => (isSelf ? base44.entities.UserAchievement.list() : base44.entities.UserAchievement.filter({ user_id: targetId })),
    enabled: isSelf ? !!user : !!targetId,
    staleTime: 15000,
  });
  const tid = isSelf ? user?.id : targetId;
  const { data: threads = [] } = useQuery({ queryKey: ["profile-threads", tid], queryFn: () => base44.entities.ForumThread.filter({ author_id: tid }, "-created_date", 10), enabled: !!tid, staleTime: 30000 });
  const { data: posts = [] } = useQuery({ queryKey: ["profile-posts", tid], queryFn: () => base44.entities.ForumPost.filter({ author_id: tid }, "-created_date", 10), enabled: !!tid, staleTime: 30000 });
  const { data: clubs = [] } = useQuery({ queryKey: ["profile-clubs", tid], queryFn: () => base44.entities.CommunityMember.filter({ user_id: tid, is_active: true }, "-joined_date", 20), enabled: !!tid, staleTime: 60000 });
  const { data: bookmarks = [] } = useQuery({ queryKey: ["profile-bookmarks", tid], queryFn: () => base44.entities.ForumSubscription.filter({ user_id: tid, is_bookmarked: true }, "-created_date", 10), enabled: isSelf && !!tid, staleTime: 30000 });

  const displayName = isSelf ? (user?.full_name || mistUser.callsign) : (otherProfile?.full_name || "MIST Member");
  const callsign = isSelf ? mistUser.callsign : (otherProfile?.callsign || stats.user_callsign);
  const avatar = isSelf ? (mistUser.avatarUrl || user?.avatar_url) : otherProfile?.avatar_url;
  const bio = isSelf ? user?.bio : otherProfile?.bio;
  const location = isSelf ? (user?.location || mistUser.location) : otherProfile?.location;
  const radios = isSelf ? (user?.radios || []) : safeArr(otherProfile?.radios);
  const joinDate = isSelf ? user?.created_date : otherProfile?.created_date;
  const role = isSelf ? mybbUser?.role : otherProfile?.role;
  const pseudoMybb = isSelf ? mybbUser : { role: role === "admin" ? "admin" : role === "moderator" ? "moderator" : undefined };
  const groups = deriveGroups(user, pseudoMybb, stats);
  const badges = deriveBadges(stats, user, pseudoMybb);
  const banner = selectBanner(stats, pseudoMybb, otherProfile?.profile_banner);
  const avatarFrame = getAvatarFrame(achievements, pseudoMybb);
  const level = stats.level || 1;

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(form);
    setEditing(false);
    setSaving(false);
  };
  const addRadio = () => { if (!newRadio.trim()) return; setForm((f) => ({ ...f, radios: [...(f.radios || []), newRadio.trim()] })); setNewRadio(""); };
  const removeRadio = (i) => setForm((f) => ({ ...f, radios: f.radios.filter((_, idx) => idx !== i) }));

  const resizeImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 100; canvas.height = 100;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(100 / img.width, 100 / img.height);
      const w = img.width * scale; const h = img.height * scale;
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
    setUploadingAvatar(true); setAvatarError("");
    try {
      const base64 = avatarFile.dataUrl.split(",")[1];
      const res = await base44.functions.invoke("uploadAvatar", { fileBase64: base64, fileName: "avatar.jpg", mimeType: "image/jpeg", username: mybbUser.username, uid: mybbUser.uid });
      if (res.data?.success) {
        login({ ...mybbUser, avatar: res.data.avatar_url });
        setAvatarPreview(null); setAvatarFile(null);
      } else setAvatarError(res.data?.error || "Upload failed");
    } catch (e) { setAvatarError("Upload failed: " + e.message); }
    setUploadingAvatar(false);
  };

  if (!isSelf && !otherProfile && !targetId) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        showBack
        rightAction={
          editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-muted-foreground"><X className="w-4 h-4" /></Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3">
                {saving ? "Saving..." : <><Save className="w-3 h-3 mr-1" />Save</>}
              </Button>
            </div>
          ) : isSelf ? (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-violet-400"><Camera className="w-4 h-4" /></Button>
          ) : null
        }
      />

      <div className="px-4 pt-4 space-y-4 pb-6">
        <ProfileHeader
          banner={banner}
          avatar={avatarPreview || avatar}
          displayName={displayName}
          callsign={callsign}
          role={role}
          groups={groups}
          avatarFrame={avatarFrame}
          location={location}
          joinDate={joinDate}
          level={level}
          reputation={stats.reputation || 0}
          isSelf={isSelf}
          onEdit={() => setEditing(true)}
          onMessage={() => {}}
          onFollow={() => {}}
          onSignOut={signOut}
        />

        {/* Avatar upload (self, editing) */}
        {isSelf && editing && (
          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-3">
            <div className="flex items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-violet-500/40 bg-violet-950/50">
                {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : (avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-violet-400 m-auto" />)}
              </button>
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-7 text-xs">Choose Avatar</Button>
                {avatarPreview && <Button size="sm" onClick={handleAvatarUpload} disabled={uploadingAvatar} className="h-7 text-xs bg-violet-600 text-white">{uploadingAvatar ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />...</> : "Save Avatar"}</Button>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
            </div>
            {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
          </div>
        )}

        {/* Edit form (self) */}
        {isSelf && editing ? (
          <div className="space-y-4 p-4 rounded-xl bg-card border border-violet-500/20">
            <h3 className="text-sm font-semibold text-foreground">Edit Profile</h3>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">GMRS Callsign</Label>
              <Input placeholder="e.g. WSEU790" value={form.callsign || ""} onChange={(e) => setForm((f) => ({ ...f, callsign: e.target.value.toUpperCase() }))} className="h-10 bg-background/50 uppercase" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input placeholder="City, State" value={form.location || ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="h-10 bg-background/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bio</Label>
              <Input placeholder="Short bio..." value={form.bio || ""} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="h-10 bg-background/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Forum Username</Label>
              <Input placeholder="Your insomniacsgmrs.com username" value={form.mybb_username || ""} onChange={(e) => setForm((f) => ({ ...f, mybb_username: e.target.value }))} className="h-10 bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Radio Equipment</Label>
              {(form.radios || []).map((radio, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-foreground bg-background/50 rounded-lg px-3 py-2 border border-border/50">{radio}</span>
                  <button onClick={() => removeRadio(i)} className="text-destructive hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Add radio (e.g. Motorola XPR 5550)" value={newRadio} onChange={(e) => setNewRadio(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRadio()} className="h-9 bg-background/50 text-sm" />
                <Button size="sm" variant="outline" onClick={addRadio} className="border-violet-500/30 text-violet-400"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {bio && <Section title="About"><p className="text-sm text-muted-foreground">{bio}</p></Section>}

            <Section title="Level & Prestige"><ProfileStats stats={stats} /></Section>

            <Section title="Lifetime Statistics"><StatsGrid stats={stats} /></Section>

            <Section title="Radio Equipment"><ProfileEquipment radios={radios} /></Section>

            <Section title="Clubs & Repeaters"><ProfileClubs clubs={clubs} favoriteRepeater={stats.favorite_repeater} /></Section>

            {badges.length > 0 && (
              <div className="p-4 rounded-xl bg-card border border-border/60">
                <h3 className="text-sm font-semibold text-foreground mb-2">Badges</h3>
                <BadgeShowcase badges={badges} onBadgeClick={() => {}} />
              </div>
            )}

            <Section title="Trophy Case" icon={Trophy}><TrophyCase achievements={achievements} onBadgeClick={() => {}} /></Section>

            <Section title="Recent Threads"><ProfileRecentThreads threads={threads} /></Section>

            <Section title="Recent Replies"><ProfileRecentReplies posts={posts} /></Section>

            {isSelf && <Section title="Bookmarks" icon={undefined}><ProfileBookmarks bookmarks={bookmarks} /></Section>}

            <Section title="Activity Timeline"><ProfileTimeline threads={threads} posts={posts} achievements={achievements} /></Section>

            <Section title="Media Gallery"><ProfileMediaGallery threads={threads} posts={posts} /></Section>

            <div className="flex gap-2">
              <Link to="/achievements" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
                <Trophy className="w-4 h-4" /> {achievements.length} Achievements
              </Link>
              <Link to="/leaderboard" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium">
                <BarChart3 className="w-4 h-4" /> Leaderboard
              </Link>
            </div>

            {isSelf && isAdmin && (
              <Link to="/platform/admin" className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-warning/10 to-primary/10 border border-warning/20 hover:border-warning/40 transition-all active:scale-[0.98]">
                <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center"><Shield className="w-5 h-5 text-warning" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Admin Control Center</p>
                  <p className="text-xs text-muted-foreground">Manage users, content, and platform settings</p>
                </div>
                <ChevronRight className="w-5 h-5 text-warning" />
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}