import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";

const CATEGORIES = ["radio", "technology", "social", "gaming", "education", "sports", "music", "professional", "hobby", "other"];

export default function CommunitySettingsTab({ community, onChanged }) {
  const { data: settings } = useQuery({
    queryKey: ["community-settings", community.id],
    queryFn: async () => (await base44.entities.CommunitySettings.filter({ community_id: community.id }))?.[0] || {},
  });
  const [f, setF] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setF({
      name: community.name || "",
      description: community.description || "",
      category: community.category || "",
      visibility: community.visibility || "private",
      join_mode: settings?.join_mode || "request",
      logo_url: community.logo_url || "",
      banner_url: community.banner_url || "",
      primary_color: community.primary_color || "#8B5CF6",
      accent_color: community.accent_color || "#06B6D4",
      location: community.location || "",
      callsign: community.callsign || "",
      frequency: community.frequency ?? "",
      pl_tone: community.pl_tone || "",
      primary_repeater: community.primary_repeater || "",
    });
  }, [community, settings]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("adminManageCommunity", { action: "update", community_id: community.id, fields: f });
      onChanged();
    } catch (e) {
      window.alert(e?.response?.data?.error || e?.message || "Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl bg-card border border-border p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">General</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Community Name</Label><Input value={f.name || ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div>
            <Label>Category</Label>
            <Select value={f.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Description</Label><Textarea value={f.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Visibility</Label>
            <Select value={f.visibility} onValueChange={(v) => set("visibility", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Join Method</Label>
            <Select value={f.join_mode} onValueChange={(v) => set("join_mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open (instant)</SelectItem>
                <SelectItem value="request">Request (approve)</SelectItem>
                <SelectItem value="invite">Invite only</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Branding</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Logo URL</Label><Input value={f.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} /></div>
          <div><Label>Banner URL</Label><Input value={f.banner_url || ""} onChange={(e) => set("banner_url", e.target.value)} /></div>
          <div>
            <Label>Primary Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={f.primary_color || "#8B5CF6"} onChange={(e) => set("primary_color", e.target.value)} className="w-9 h-9 rounded border border-border bg-transparent" />
              <Input value={f.primary_color || ""} onChange={(e) => set("primary_color", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Accent Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={f.accent_color || "#06B6D4"} onChange={(e) => set("accent_color", e.target.value)} className="w-9 h-9 rounded border border-border bg-transparent" />
              <Input value={f.accent_color || ""} onChange={(e) => set("accent_color", e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Location & Radio</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Location</Label><Input value={f.location || ""} onChange={(e) => set("location", e.target.value)} /></div>
          <div><Label>Callsign</Label><Input value={f.callsign || ""} onChange={(e) => set("callsign", e.target.value)} /></div>
          <div><Label>Primary Repeater</Label><Input value={f.primary_repeater || ""} onChange={(e) => set("primary_repeater", e.target.value)} /></div>
          <div><Label>Frequency (MHz)</Label><Input type="number" step="0.001" value={f.frequency ?? ""} onChange={(e) => set("frequency", e.target.value ? parseFloat(e.target.value) : "")} /></div>
          <div><Label>PL Tone</Label><Input value={f.pl_tone || ""} onChange={(e) => set("pl_tone", e.target.value)} /></div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Changes</>}
        </Button>
      </div>
    </div>
  );
}