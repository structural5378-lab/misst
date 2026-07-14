import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { THEMES } from "@/lib/themes";
import AdminSection from "@/components/platform/AdminSection";
import { Palette, Check, X, Clock, RefreshCw, Activity } from "lucide-react";

const ALL_TOKEN_KEYS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'destructive', 'destructive-foreground', 'success', 'success-foreground',
  'warning', 'warning-foreground', 'info', 'info-foreground',
  'border', 'input', 'ring',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  'sidebar-background', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
];

export default function PlatformAdminThemeDiagnostic() {
  const { themeId, previewThemeId, accentColor, amoled, compact, animationIntensity, cardStyle, iconStyle, uiScale, animatedBg } = useTheme();
  const tc = useThemeColors();
  const currentThemeId = previewThemeId || themeId;
  const theme = THEMES[currentThemeId] || THEMES.classic;

  const [computedVars, setComputedVars] = useState({});
  const [loadTime, setLoadTime] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const vars = {};
    ALL_TOKEN_KEYS.forEach(key => {
      vars[key] = style.getPropertyValue(`--${key}`).trim();
    });
    setComputedVars(vars);
    setLoadTime(performance.now() - start);
  }, [currentThemeId, accentColor, amoled, refreshKey]);

  const missingTokens = ALL_TOKEN_KEYS.filter(key => !computedVars[key]);
  const hasDarkClass = document.documentElement.classList.contains('dark');
  const hasTransitionClass = document.documentElement.classList.contains('theme-transition');

  const swatches = [
    { label: 'Background', key: 'background', color: tc.background },
    { label: 'Card', key: 'card', color: tc.card },
    { label: 'Popover', key: 'popover', color: tc.popover },
    { label: 'Foreground', key: 'foreground', color: tc.foreground },
    { label: 'Primary', key: 'primary', color: tc.primary },
    { label: 'Primary FG', key: 'primary-foreground', color: tc.primaryForeground },
    { label: 'Secondary', key: 'secondary', color: tc.secondary },
    { label: 'Muted', key: 'muted', color: tc.muted },
    { label: 'Muted FG', key: 'muted-foreground', color: tc.mutedForeground },
    { label: 'Accent', key: 'accent', color: tc.accent },
    { label: 'Destructive', key: 'destructive', color: tc.destructive },
    { label: 'Success', key: 'success', color: tc.success },
    { label: 'Warning', key: 'warning', color: tc.warning },
    { label: 'Info', key: 'info', color: tc.info },
    { label: 'Border', key: 'border', color: tc.border },
    { label: 'Input', key: 'input', color: tc.input },
  ];

  const chartSwatches = [
    { label: 'Chart 1', color: tc.chart1 },
    { label: 'Chart 2', color: tc.chart2 },
    { label: 'Chart 3', color: tc.chart3 },
    { label: 'Chart 4', color: tc.chart4 },
    { label: 'Chart 5', color: tc.chart5 },
  ];

  const features = [
    { label: 'AMOLED', value: amoled },
    { label: 'Compact', value: compact },
    { label: 'Animated BG', value: animatedBg },
    { label: 'Card Style', value: cardStyle },
    { label: 'Icon Style', value: iconStyle },
    { label: 'UI Scale', value: uiScale },
    { label: 'Animation', value: animationIntensity },
    { label: 'Preview Active', value: previewThemeId !== null },
  ];

  return (
    <AdminSection title="Theme Diagnostic" description="Real-time theme engine diagnostics and token validation">
      {/* Active Theme */}
      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" /> Active Theme
          </h3>
          <button onClick={() => setRefreshKey(k => k + 1)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between p-2 rounded-lg bg-background/50 border border-border">
            <span className="text-muted-foreground">Theme ID</span>
            <span className="text-foreground font-mono">{currentThemeId}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-background/50 border border-border">
            <span className="text-muted-foreground">Theme Name</span>
            <span className="text-foreground">{theme.name}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-background/50 border border-border">
            <span className="text-muted-foreground">Accent Override</span>
            <span className="text-foreground font-mono">{accentColor || 'None'}</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-background/50 border border-border">
            <span className="text-muted-foreground">Load Time</span>
            <span className="text-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{loadTime.toFixed(2)}ms</span>
          </div>
        </div>
      </div>

      {/* Validation Checks */}
      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" /> Validation Checks
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border">
            <span className="text-xs text-muted-foreground">.dark class on &lt;html&gt;</span>
            {hasDarkClass ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-destructive" />}
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border">
            <span className="text-xs text-muted-foreground">All {ALL_TOKEN_KEYS.length} tokens loaded</span>
            {missingTokens.length === 0 ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-destructive" />}
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border">
            <span className="text-xs text-muted-foreground">Theme transition class (transient)</span>
            {hasTransitionClass ? <X className="w-4 h-4 text-warning" /> : <Check className="w-4 h-4 text-success" />}
          </div>
          {missingTokens.length > 0 && (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive font-medium mb-1">Missing tokens:</p>
              <p className="text-xs text-muted-foreground font-mono">{missingTokens.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Theme Features</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {features.map(f => (
            <div key={f.label} className="flex justify-between p-2 rounded-lg bg-background/50 border border-border">
              <span className="text-muted-foreground">{f.label}</span>
              <span className={`font-mono ${f.value === true ? 'text-success' : f.value === false ? 'text-muted-foreground' : 'text-foreground'}`}>
                {String(f.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Color Palette</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {swatches.map(s => (
            <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border">
              <div className="w-8 h-8 rounded-md border border-border shrink-0" style={{ background: s.color }} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{s.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{computedVars[s.key] || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Colors */}
      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Chart Colors</h3>
        <div className="flex gap-3 flex-wrap">
          {chartSwatches.map(c => (
            <div key={c.label} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-lg border border-border" style={{ background: c.color }} />
              <span className="text-[10px] text-muted-foreground">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All CSS Variables */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Loaded CSS Variables ({Object.keys(computedVars).length})</h3>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {Object.entries(computedVars).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted">
              <span className="text-muted-foreground font-mono w-44 truncate shrink-0">--{key}</span>
              <span className="text-foreground font-mono flex-1 truncate">{value || 'MISSING'}</span>
              <div className="w-4 h-4 rounded border border-border shrink-0" style={{ background: value ? `hsl(${value})` : 'transparent' }} />
            </div>
          ))}
        </div>
      </div>
    </AdminSection>
  );
}