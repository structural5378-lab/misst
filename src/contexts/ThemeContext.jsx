import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEMES } from '@/lib/themes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [savedThemeId, setSavedThemeId] = useState(() => localStorage.getItem('mist-theme') || 'classic');
  const [previewThemeId, setPreviewThemeId] = useState(null);
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('mist-accent') || '');
  const [cardStyle, setCardStyle] = useState(() => localStorage.getItem('mist-card-style') || 'rounded');
  const [iconStyle, setIconStyle] = useState(() => localStorage.getItem('mist-icon-style') || 'default');
  const [animationIntensity, setAnimationIntensity] = useState(() => localStorage.getItem('mist-anim') || 'normal');
  const [animatedBg, setAnimatedBg] = useState(() => localStorage.getItem('mist-anim-bg') !== 'false');
  const [amoled, setAmoled] = useState(() => localStorage.getItem('mist-amoled') === 'true');
  const [compact, setCompact] = useState(() => localStorage.getItem('mist-compact') === 'true');
  const [uiScale, setUiScale] = useState(() => localStorage.getItem('mist-scale') || 'medium');

  const currentThemeId = previewThemeId || savedThemeId;

  // Apply theme CSS variables + AMOLED + accent overrides
  useEffect(() => {
    const theme = THEMES[currentThemeId] || THEMES.classic;
    const root = document.documentElement;
    root.classList.add('theme-transition');
    Object.entries(theme.vars).forEach(([key, value]) => {
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
    const t = setTimeout(() => root.classList.remove('theme-transition'), 350);
    return () => clearTimeout(t);
  }, [currentThemeId, amoled, accentColor]);

  // Apply body classes for card style, animation, scaling, compact, etc.
  useEffect(() => {
    const classes = [
      `cards-${cardStyle}`,
      `anim-${animationIntensity}`,
      `scale-${uiScale}`,
      `icon-${iconStyle}`,
      compact ? 'compact-mode' : '',
      !animatedBg ? 'no-anim-bg' : '',
      amoled ? 'amoled-mode' : '',
    ].filter(Boolean);
    document.body.className = classes.join(' ');
  }, [cardStyle, animationIntensity, uiScale, iconStyle, compact, animatedBg, amoled]);

  // Persist settings
  useEffect(() => { localStorage.setItem('mist-accent', accentColor); }, [accentColor]);
  useEffect(() => { localStorage.setItem('mist-card-style', cardStyle); }, [cardStyle]);
  useEffect(() => { localStorage.setItem('mist-icon-style', iconStyle); }, [iconStyle]);
  useEffect(() => { localStorage.setItem('mist-anim', animationIntensity); }, [animationIntensity]);
  useEffect(() => { localStorage.setItem('mist-anim-bg', String(animatedBg)); }, [animatedBg]);
  useEffect(() => { localStorage.setItem('mist-amoled', String(amoled)); }, [amoled]);
  useEffect(() => { localStorage.setItem('mist-compact', String(compact)); }, [compact]);
  useEffect(() => { localStorage.setItem('mist-scale', uiScale); }, [uiScale]);

  const previewTheme = useCallback((id) => setPreviewThemeId(id), []);
  const applyTheme = useCallback((id) => {
    setSavedThemeId(id);
    setPreviewThemeId(null);
    localStorage.setItem('mist-theme', id);
  }, []);
  const cancelPreview = useCallback(() => setPreviewThemeId(null), []);

  return (
    <ThemeContext.Provider value={{
      themeId: savedThemeId,
      previewThemeId: currentThemeId,
      hasPendingPreview: previewThemeId !== null && previewThemeId !== savedThemeId,
      previewTheme, applyTheme, cancelPreview,
      accentColor, setAccentColor,
      cardStyle, setCardStyle,
      iconStyle, setIconStyle,
      animationIntensity, setAnimationIntensity,
      animatedBg, setAnimatedBg,
      amoled, setAmoled,
      compact, setCompact,
      uiScale, setUiScale,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}