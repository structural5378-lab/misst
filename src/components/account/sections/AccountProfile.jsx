import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMistUser } from "@/hooks/useMistUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionCard, Field } from "../ui";
import AvatarUploader from "../AvatarUploader";
import BannerUploader from "../BannerUploader";
import { Pencil, Check, X, MapPin, Link as LinkIcon, Award, Calendar, ShieldCheck } from "lucide-react";

export default function AccountProfile() {
  const { mistUser, user, updateProfile } = useMistUser();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!edit) {
      setForm({
        username: mistUser.username || "",
        display_name: user?.display_name || "",
        callsign: mistUser.callsign || "",
        bio: user?.bio || "",
        about_me: user?.about_me || "",
        location: user?.location || "",
        website: user?.website || "",
        social_links: user?.social_links || "",
        occupation: user?.occupation || "",
        interests: user?.interests || "",
      });
    }
  }, [edit, mistUser, user]);

  const { data: stats = {} } = useQuery({
    queryKey: ["mist-user-stats", user?.id],
    queryFn: async () => (await base44.entities.UserStats.filter({ user_id: user.id }))?.[0] || {},
    enabled: !!user?.id,
    staleTime: 30000,
  });
  const { data: achievements = [] } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: () => base44.entities.UserAchievement.filter({ user_id: user.id }, "-created_date", 12),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const usernameOk = /^[a-zA-Z0-9_]{3,20}$/.test(form.username || "");

  const save = async () => {
    if (!usernameOk) return;
    setSaving(true);
    try {
      await updateProfile({
        username: form.username,
        display_name: form.display_name,
        callsign: form.callsign,
        bio: form.bio,
        about_me: form.about_me,
        location: form.location,
        website: form.website,
        social_links: form.social_links,
        occupation: form.occupation,
        interests: form.interests,
      });
      setEdit(false);
    } catch {} finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden border border-border bg-card">
        <div className="h-32 bg-gradient-to-r from-violet-900/60 to-indigo-900/60 relative">
          {user?.banner_url && <img src={user.banner_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="px-4 pb-4 -mt-10">
          <div className="flex items-end justify-between gap-3">
            <div className="relative">
              {mistUser.avatarUrl ? (
                <img src={mistUser.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-card" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold border-4 border-card">
                  {(mistUser.displayName || "M").charAt(0)}
                </div>
              )}
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-card" />
            </div>
            <Button variant={edit ? "outline" : "default"} size="sm" onClick={() => setEdit((e) => !e)}>
              {edit ? (<><X className="w-3.5 h-3.5" /> Cancel</>) : (<><Pencil className="w-3.5 h-3.5" /> Edit Profile</>)}
            </Button>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{mistUser.displayName}</h2>
              {mistUser.callsign && <Badge variant="secondary" className="text-primary">{mistUser.callsign}</Badge>}
              {user?.email_verified && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              <Badge variant="outline" className="capitalize">{mistUser.role}</Badge>
            </div>
            {user?.bio && <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{user?.location || "Unknown"}</span>
              <span className="flex items-center gap-1"><LinkIcon className="w-3 h-3" />{user?.website || "No website"}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Member since {user?.created_date ? new Date(user.created_date).toLocaleDateString() : "—"}</span>
              <span>Reputation: <b className="text-foreground">{stats.reputation ?? mistUser.reputation ?? 0}</b></span>
            </div>
          </div>
        </div>
      </div>

      <SectionCard title="Badges & Achievements" desc={`${achievements.length} unlocked`} icon={Award}>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No achievements yet. Participate in the community to earn badges!</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <div key={a.id} className="flex flex-col items-center w-20 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-1">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-muted-foreground line-clamp-2">{a.achievement_name || a.name || "Badge"}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {edit && (
        <SectionCard
          title="Edit Profile Information"
          icon={Pencil}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEdit(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !usernameOk}>
                {saving ? "Saving…" : (<><Check className="w-4 h-4" /> Save Changes</>)}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <AvatarUploader />
            <BannerUploader />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Username" hint="3–20 chars · letters, numbers, underscore">
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} maxLength={20} />
              </Field>
              <Field label="Display Name">
                <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              </Field>
              <Field label="GMRS Callsign">
                <Input value={form.callsign} onChange={(e) => setForm({ ...form, callsign: e.target.value })} />
              </Field>
              <Field label="Location (optional)">
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
              </Field>
              <Field label="Occupation (optional)">
                <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
              </Field>
            </div>
            <Field label="Bio"><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} /></Field>
            <Field label="About Me"><Textarea value={form.about_me} onChange={(e) => setForm({ ...form, about_me: e.target.value })} rows={4} /></Field>
            <Field label="Interests" hint="Comma-separated"><Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} /></Field>
            <Field label="Social Links" hint="Comma-separated URLs (Twitter, Facebook, etc.)"><Textarea value={form.social_links} onChange={(e) => setForm({ ...form, social_links: e.target.value })} rows={2} /></Field>
            {!usernameOk && <p className="text-xs text-destructive">Username must be 3–20 characters (letters, numbers, underscore).</p>}
          </div>
        </SectionCard>
      )}
    </div>
  );
}