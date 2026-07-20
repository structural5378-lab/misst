import { useQuery } from "@tanstack/react-query";
import { useMistUser } from "@/hooks/useMistUser";
import { useParsedField, DEFAULT_PRIVACY, WHO_OPTIONS } from "@/hooks/useAccountPrefs";
import { base44 } from "@/api/base44Client";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SectionCard, ToggleRow, Field } from "../ui";
import { Eye, Ban, VolumeX, Trash2 } from "lucide-react";

const CONTROLS = [
  { key: "message_me", label: "Who can message me" },
  { key: "follow_me", label: "Who can follow me" },
  { key: "view_profile", label: "Who can view my profile" },
  { key: "view_equipment", label: "Who can view my equipment" },
  { key: "see_online", label: "Who can see my online status" },
  { key: "view_location", label: "Who can view my location" },
];

export default function AccountPrivacy() {
  const { user } = useMistUser();
  const [p, save] = useParsedField("privacy_settings", DEFAULT_PRIVACY);
  const set = (k, v) => save({ ...p, [k]: v });

  const { data: blocked = [], refetch } = useQuery({
    queryKey: ["blocked-users", user?.id],
    queryFn: () => base44.entities.BlockedUser.filter({ user_id: user.id }, "-blocked_at", 100),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const unblock = async (b) => {
    await base44.entities.BlockedUser.delete(b.id);
    refetch();
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Visibility" desc="Control who can interact with you." icon={Eye}>
        <div className="grid sm:grid-cols-2 gap-4">
          {CONTROLS.map((c) => (
            <Field key={c.key} label={c.label}>
              <Select value={p[c.key]} onValueChange={(v) => set(c.key, v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WHO_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          ))}
        </div>
        <div className="mt-4">
          <ToggleRow
            label="Search engine indexing"
            desc="Allow search engines to index your profile."
            checked={!!p.search_index}
            onChange={(v) => set("search_index", v)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Blocked Users" desc={`${blocked.length} blocked`} icon={Ban}>
        {blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
        ) : (
          <div className="space-y-2">
            {blocked.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {b.blocked_user_avatar ? (
                    <img src={b.blocked_user_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold">
                      {(b.blocked_user_name || "?").charAt(0)}
                    </div>
                  )}
                  <span className="text-sm truncate">{b.blocked_user_name || "Unknown"}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => unblock(b)}><Trash2 className="w-3.5 h-3.5" /> Unblock</Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Muted Users" desc="Muted users' content is hidden from your feeds." icon={VolumeX}>
        <p className="text-sm text-muted-foreground">You haven't muted anyone yet. Mute controls are available on user profiles and forum threads.</p>
      </SectionCard>
    </div>
  );
}