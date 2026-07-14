import { useTheme } from '@/contexts/ThemeContext';
import { THEMES } from '@/lib/themes';

/**
 * Reusable hook that returns the active theme's colors as usable CSS strings.
 * Use this for libraries that need actual color values (Recharts, Leaflet, etc.)
 * instead of CSS variable references.
 */
export function useThemeColors() {
  const { themeId, previewThemeId, accentColor } = useTheme();
  const currentThemeId = previewThemeId || themeId;
  const theme = THEMES[currentThemeId] || THEMES.classic;

  const hsl = (key) => `hsl(${theme.vars[key]})`;

  // Accent override takes precedence for primary
  const primary = accentColor ? `hsl(${accentColor})` : hsl('primary');
  const primaryForeground = accentColor ? 'hsl(0 0% 100%)' : hsl('primary-foreground');

  return {
    themeId: currentThemeId,
    themeName: theme.name,
    background: hsl('background'),
    foreground: hsl('foreground'),
    card: hsl('card'),
    cardForeground: hsl('card-foreground'),
    popover: hsl('popover'),
    popoverForeground: hsl('popover-foreground'),
    primary,
    primaryForeground,
    secondary: hsl('secondary'),
    secondaryForeground: hsl('secondary-foreground'),
    muted: hsl('muted'),
    mutedForeground: hsl('muted-foreground'),
    accent: hsl('accent'),
    accentForeground: hsl('accent-foreground'),
    destructive: hsl('destructive'),
    destructiveForeground: hsl('destructive-foreground'),
    success: hsl('success'),
    successForeground: hsl('success-foreground'),
    warning: hsl('warning'),
    warningForeground: hsl('warning-foreground'),
    info: hsl('info'),
    infoForeground: hsl('info-foreground'),
    border: hsl('border'),
    input: hsl('input'),
    ring: hsl('ring'),
    chart1: hsl('chart-1'),
    chart2: hsl('chart-2'),
    chart3: hsl('chart-3'),
    chart4: hsl('chart-4'),
    chart5: hsl('chart-5'),
    sidebarBackground: hsl('sidebar-background'),
    sidebarForeground: hsl('sidebar-foreground'),
    sidebarPrimary: hsl('sidebar-primary'),
    sidebarBorder: hsl('sidebar-border'),
  };
}