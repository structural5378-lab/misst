import React, { useState, useEffect, useRef } from "react";
import { Palette, RotateCcw, Save, Eye } from "lucide-react";
import AdminSection from "@/components/platform/AdminSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { THEMES } from "@/lib/themes";

const DEFAULT_THEME = {
  primary: "#a855f7",
  accent: "#06b6d4",
  background: "#1a1a2e",
  card: "#1e1e3f",
  border: "#2d2d4f",
  radius: "0.75",
  glow: "60",
  font: "Inter",
  darkMode: true,
};

const FONTS = ["Inter", "Roboto", "Poppins", "Montserrat", "Oswald", "JetBrains Mono"];

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function PlatformAdminThemeBuilder() {
  const { themeId, accentColor, amoled } = useTheme();
  const restoreRef = useRef({ themeId, accentColor, amoled });
  restoreRef.current = { themeId, accentColor, amoled };

  const [theme, setTheme] = useState(() => {
    try { return { ...DEFAULT_THEME, ...JSON.parse(localStorage.getItem("admin_theme") || "{}") }; }
    catch { return DEFAULT_THEME; }
  });
  const [saved, setSaved] = useState(false);

  const applyTheme = (t) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", hexToHsl(t.primary));
    root.style.setProperty("--accent", hexToHsl(t.accent));
    root.style.setProperty("--background", hexToHsl(t.background));
    root.style.setProperty("--card", hexToHsl(t.card));
    root.style.setProperty("--border", hexToHsl(t.border));
    root.style.setProperty("--radius", `${t.radius}rem`);
  };

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    return () => {
      const root = document.documentElement;
      ["--primary", "--accent", "--background", "--card", "--border", "--radius"].forEach(p => root.style.removeProperty(p));
      // Re-apply the active theme from ThemeContext to restore all CSS variables
      const { themeId, accentColor, amoled } = restoreRef.current;
      const t = THEMES[themeId] || THEMES.classic;
      Object.entries(t.vars).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
      if (amoled) {
        root.style.setProperty('--background', '0 0% 0%');
        root.style.setProperty('--card', '0 0% 4%');
        root.style.setProperty('--popover', '0 0% 4%');
        root.style.setProperty('--sidebar-background', '0 0% 4%');
      }
      if (accentColor) {
        root.style.setProperty('--primary', accentColor);
      }
    };
  }, []);

  const save = () => {
    localStorage.setItem("admin_theme", JSON.stringify(theme));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    setTheme(DEFAULT_THEME);
    localStorage.removeItem("admin_theme");
    applyTheme(DEFAULT_THEME);
  };

  const update = (key, val) => setTheme(t => ({ ...t, [key]: val }));

  const colorFields = [
    { key: "primary", label: "Primary Color" },
    { key: "accent", label: "Accent Color" },
    { key: "background", label: "Background" },
    { key: "card", label: "Card Color" },
    { key: "border", label: "Border Color" },
  ];

  return (
    <AdminSection
      title="Theme Builder"
      description="Customize the MIST platform theme with live preview"
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} className="border-border text-muted-foreground"><RotateCcw className="w-4 h-4 mr-1" />Reset</Button>
          <Button onClick={save} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Save className="w-4 h-4 mr-1" />{saved ? "Saved!" : "Save"}</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Palette className="w-4 h-4 text-primary" />Colors</h3>
          {colorFields.map(f => (
            <div key={f.key} className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">{f.label}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={theme[f.key]} onChange={e => update(f.key, e.target.value)} className="w-9 h-9 rounded-lg border border-border bg-transparent cursor-pointer" />
                <span className="text-xs text-muted-foreground font-mono w-16">{theme[f.key]}</span>
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-border">
            <Label className="text-sm text-muted-foreground">Border Radius: {theme.radius}rem</Label>
            <input type="range" min="0" max="1.5" step="0.05" value={theme.radius} onChange={e => update("radius", e.target.value)} className="w-full mt-2 accent-primary" />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Glow Intensity: {theme.glow}%</Label>
            <input type="range" min="0" max="100" step="5" value={theme.glow} onChange={e => update("glow", e.target.value)} className="w-full mt-2 accent-primary" />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Font Family</Label>
            <select value={theme.font} onChange={e => update("font", e.target.value)} className="w-full mt-1 h-9 rounded-lg bg-background border border-border px-3 text-sm text-foreground">
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Dark Mode</Label>
            <button onClick={() => update("darkMode", !theme.darkMode)} className={`relative w-11 h-6 rounded-full transition-colors ${theme.darkMode ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-foreground shadow transition-transform ${theme.darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="rounded-xl bg-card border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4"><Eye className="w-4 h-4 text-primary" />Live Preview</h3>
          <div className="space-y-3" style={{ filter: `drop-shadow(0 0 ${theme.glow / 4}px ${theme.primary})` }}>
            <div className="rounded-xl p-4" style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: `${theme.radius}rem` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full" style={{ background: theme.primary, boxShadow: `0 0 ${theme.glow / 3}px ${theme.primary}` }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: "#e0e0ff", fontFamily: theme.font }}>Operator WSEU790</p>
                  <p className="text-xs" style={{ color: "#8888aa", fontFamily: theme.font }}>Miami, FL · GMRS</p>
                </div>
              </div>
              <p className="text-xs" style={{ color: "#aaaacc", fontFamily: theme.font }}>Monitoring repeater K4MIA on 462.675 MHz with 141.3 Hz PL tone.</p>
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: theme.primary, borderRadius: `${theme.radius}rem`, boxShadow: `0 0 ${theme.glow / 3}px ${theme.primary}`, fontFamily: theme.font }}>Primary Button</button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: theme.border, color: theme.accent, borderRadius: `${theme.radius}rem`, fontFamily: theme.font }}>Outline</button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["Stat A", "Stat B", "Stat C"].map((s, i) => (
                <div key={s} className="rounded-lg p-3 text-center" style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: `${theme.radius}rem` }}>
                  <p className="text-lg font-bold" style={{ color: i === 0 ? theme.primary : i === 1 ? theme.accent : "#e0e0ff", fontFamily: theme.font }}>{i + 1}2{i}</p>
                  <p className="text-[10px]" style={{ color: "#8888aa", fontFamily: theme.font }}>{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminSection>
  );
}