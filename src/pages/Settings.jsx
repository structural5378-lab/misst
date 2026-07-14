import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/contexts/ThemeContext';
import { THEMES, ACCENT_COLORS } from '@/lib/themes';
import PageHeader from '@/components/layout/PageHeader';
import ThemePreviewCard from '@/components/settings/ThemePreviewCard';
import SegmentedControl from '@/components/settings/SegmentedControl';
import ToggleRow from '@/components/settings/ToggleRow';
import { Palette, Sparkles, Moon, Eye, Check, X, Shield, ChevronRight } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const {
    themeId, previewThemeId, hasPendingPreview,
    previewTheme, applyTheme, cancelPreview,
    accentColor, setAccentColor,
    cardStyle, setCardStyle,
    iconStyle, setIconStyle,
    animationIntensity, setAnimationIntensity,
    animatedBg, setAnimatedBg,
    amoled, setAmoled,
    compact, setCompact,
    uiScale, setUiScale,
  } = useTheme();

  // Revert pending preview on unmount
  useEffect(() => () => { cancelPreview(); }, []);

  const handleApply = () => {
    applyTheme(previewThemeId);
    navigate(-1);
  };

  const handleCancel = () => {
    cancelPreview();
    navigate(-1);
  };

  const { data: platformData } = useQuery({
    queryKey: ['platform-roles-settings'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPlatformRoles', {});
      return res.data;
    },
  });
  const isAdmin = (platformData?.platform_roles || []).length > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Settings" showBack />
      <div className="px-4 pt-4 space-y-6">
        {/* Appearance */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" /> Appearance
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Personalize your MIST experience</p>

          {/* Theme */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Theme</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(THEMES).map(theme => (
                <ThemePreviewCard
                  key={theme.id}
                  theme={theme}
                  isSelected={previewThemeId === theme.id}
                  onSelect={previewTheme}
                />
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Accent Color</h3>
            <div className="flex gap-2 flex-wrap">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => setAccentColor(color.value || '')}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    accentColor === (color.value || '') ? 'border-foreground scale-110' : 'border-border hover:scale-105'
                  }`}
                  style={color.value
                    ? { background: `hsl(${color.value})` }
                    : { background: 'conic-gradient(from 0deg, #a855f7, #06b6d4, #a855f7)' }
                  }
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Card Style */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Card Style</h3>
            <SegmentedControl
              options={[{ value: 'rounded', label: 'Rounded' }, { value: 'square', label: 'Square' }]}
              value={cardStyle}
              onChange={setCardStyle}
            />
          </div>

          {/* Icon Style */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Icon Style</h3>
            <SegmentedControl
              options={[{ value: 'default', label: 'Default' }, { value: 'bold', label: 'Bold' }, { value: 'outline', label: 'Outline' }]}
              value={iconStyle}
              onChange={setIconStyle}
            />
          </div>

          {/* Animation Intensity */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">Animation Intensity</h3>
            <SegmentedControl
              options={[
                { value: 'minimal', label: 'Minimal' },
                { value: 'normal', label: 'Normal' },
                { value: 'enhanced', label: 'Enhanced' },
                { value: 'performance', label: 'Performance' },
              ]}
              value={animationIntensity}
              onChange={setAnimationIntensity}
            />
          </div>

          {/* UI Scaling */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">UI Scaling</h3>
            <SegmentedControl
              options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
              value={uiScale}
              onChange={setUiScale}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 mb-5">
            <ToggleRow icon={Sparkles} label="Animated Backgrounds" description="Animate profile banner effects" checked={animatedBg} onChange={setAnimatedBg} />
            <ToggleRow icon={Moon} label="AMOLED Black Mode" description="Pure black for OLED screens" checked={amoled} onChange={setAmoled} />
            <ToggleRow icon={Eye} label="Compact Mode" description="Reduce spacing for more content" checked={compact} onChange={setCompact} />
          </div>
        </div>

        {/* Admin Access */}
        {isAdmin && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" /> Administration
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Platform management tools</p>
            <Link
              to="/platform/admin"
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-violet-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Admin Control Center</p>
                <p className="text-xs text-muted-foreground">Manage users, content, and platform settings</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400" />
            </Link>
          </div>
        )}

        {/* Apply / Cancel */}
        {hasPendingPreview && (
          <div className="flex gap-3 pb-4 sticky bottom-4">
            <button onClick={handleCancel} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium border border-border flex items-center justify-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleApply} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Apply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}