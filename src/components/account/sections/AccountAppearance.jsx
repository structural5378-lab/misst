import { useTheme } from "@/contexts/ThemeContext";
import { THEMES } from "@/lib/themes";
import { SectionCard, Field } from "../ui";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { ToggleRow } from "../ui";
import { Palette, Type, Layout, Moon } from "lucide-react";

const ACCENTS = ["", "270 65% 55%", "190 70% 45%", "142 60% 45%", "30 80% 55%", "340 75% 55%", "210 80% 55%"];
const ACCENT_LABELS = { "": "Theme Default", "270 65% 55%": "Violet", "190 70% 45%": "Cyan", "142 60% 45%": "Emerald", "30 80% 55%": "Amber", "340 75% 55%": "Rose", "210 80% 55%": "Blue" };

export default function AccountAppearance() {
  const {
    themeId, applyTheme, accentColor, setAccentColor, uiScale, setUiScale,
    compact, setCompact, cardStyle, setCardStyle, amoled, setAmoled,
  } = useTheme();

  const themeEntries = Object.entries(THEMES);

  return (
    <div className="space-y-4">
      <SectionCard title="Theme" desc="Choose your MIST color theme." icon={Palette}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {themeEntries.map(([id, t]) => {
            const on = themeId === id;
            const swatch = t.vars?.primary || "270 65% 55%";
            return (
              <button
                key={id}
                onClick={() => applyTheme(id)}
                className={`rounded-xl border p-3 text-left transition-colors ${on ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <div className="h-10 rounded-lg mb-2" style={{ background: `hsl(${swatch})` }} />
                <p className="text-sm font-medium">{t.name || id}</p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="AMOLED Black" desc="Pure black background for OLED displays." icon={Moon}>
        <ToggleRow label="AMOLED mode" desc="Use a true-black background." checked={amoled} onChange={setAmoled} />
      </SectionCard>

      <SectionCard title="Accent Color" desc="Personalize your highlight color." icon={Palette}>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a || "default"}
              onClick={() => setAccentColor(a)}
              title={ACCENT_LABELS[a]}
              className={`w-9 h-9 rounded-full border-2 ${accentColor === a ? "border-foreground" : "border-border"}`}
              style={{ background: a ? `hsl(${a})` : "linear-gradient(135deg, #a78bfa, #22d3ee, #34d399)" }}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Display" desc="Text size and layout density." icon={Type}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Font Size">
            <Select value={uiScale} onValueChange={setUiScale}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Card Style">
            <Select value={cardStyle} onValueChange={setCardStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="square">Square</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-3">
          <ToggleRow label="Compact Mode" desc="Reduce spacing for denser layouts." checked={compact} onChange={setCompact} />
        </div>
      </SectionCard>

      <SectionCard title="Layout Preview" icon={Layout}>
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="h-3 w-2/3 rounded bg-primary/30" />
          <div className="h-2 w-full rounded bg-secondary" />
          <div className="h-2 w-4/5 rounded bg-secondary" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Changes apply instantly across MIST.</p>
      </SectionCard>
    </div>
  );
}