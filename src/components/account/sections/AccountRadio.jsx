import { useMistUser } from "@/hooks/useMistUser";
import { useParsedField, DEFAULT_RADIO } from "@/hooks/useAccountPrefs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionCard, Field, ListEditor, ToggleRow } from "../ui";
import { Radio, ShieldCheck, Antenna, Heart, Home, Cpu, Phone, Users } from "lucide-react";

export default function AccountRadio() {
  const { mistUser, updateProfile } = useMistUser();
  const [r, save] = useParsedField("radio_profile", { ...DEFAULT_RADIO, callsign: mistUser.callsign || "" });
  const set = (k, v) => save({ ...r, [k]: v });

  return (
    <div className="space-y-4">
      <SectionCard title="GMRS Identity" desc="Your radio operator identity." icon={Radio}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="GMRS Callsign">
            <Input
              value={r.callsign}
              onChange={(e) => set("callsign", e.target.value)}
              onBlur={() => updateProfile({ callsign: r.callsign })}
              placeholder="e.g. WQYR123"
            />
          </Field>
          <Field label="Home Repeater">
            <Input value={r.home_repeater || ""} onChange={(e) => set("home_repeater", e.target.value)} placeholder="Frequency / callsign" />
          </Field>
        </div>
        <div className="mt-3">
          <ToggleRow
            label="FCC Verification"
            desc="Confirm you hold a valid GMRS license."
            checked={!!r.fcc_verified}
            onChange={(v) => set("fcc_verified", v)}
          />
          {r.fcc_verified && <Badge className="mt-2 bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><ShieldCheck className="w-3 h-3" /> FCC Verified</Badge>}
        </div>
      </SectionCard>

      <SectionCard title="Equipment List" desc="Radios in your collection." icon={Cpu}>
        <ListEditor items={r.equipment || []} onChange={(v) => set("equipment", v)} placeholder="e.g. Wouxun KG-935G" />
      </SectionCard>

      <SectionCard title="Radio Fleet" desc="Active radios in rotation." icon={Radio}>
        <ListEditor items={r.fleet || []} onChange={(v) => set("fleet", v)} placeholder="e.g. Mobile rig (477.275)" />
      </SectionCard>

      <SectionCard title="Antennas" desc="Antennas you use." icon={Antenna}>
        <ListEditor items={r.antennas || []} onChange={(v) => set("antennas", v)} placeholder="e.g. Nagoya NA-771" />
      </SectionCard>

      <SectionCard title="Favorite Repeaters" desc="Repeaters you frequent." icon={Heart}>
        <ListEditor items={r.favorite_repeaters || []} onChange={(v) => set("favorite_repeaters", v)} placeholder="e.g. Mount Vision 462.675" />
      </SectionCard>

      <SectionCard title="Club Memberships" desc="Radio clubs you belong to." icon={Users}>
        <ListEditor items={r.club_memberships || []} onChange={(v) => set("club_memberships", v)} placeholder="e.g. Insomniacs GMRS" />
      </SectionCard>

      <SectionCard title="Emergency Contacts" desc="Optional — who to reach in an emergency." icon={Phone}>
        <ListEditor items={r.emergency_contacts || []} onChange={(v) => set("emergency_contacts", v)} placeholder="Name / phone" />
      </SectionCard>

    </div>
  );
}