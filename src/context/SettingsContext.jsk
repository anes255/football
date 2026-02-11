import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../api';

const SettingsContext = createContext();

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
};

const applySettings = (settings) => {
  const root = document.documentElement;
  const map = {
    primary_color: '--color-primary',
    accent_color: '--color-accent',
    secondary_color: '--color-secondary',
    bg_color: '--color-bg',
    bg_color_2: '--color-bg-2',
    card_color: '--color-card',
    card_border: '--color-card-border',
    navbar_bg: '--color-navbar-bg',
    navbar_text: '--color-navbar-text',
    text_color: '--color-text',
    text_muted: '--color-text-muted',
    gradient_start: '--color-gradient-start',
    gradient_end: '--color-gradient-end',
    success_color: '--color-success',
    error_color: '--color-error',
    warning_color: '--color-warning',
    live_color: '--color-live',
    scrollbar_thumb: '--color-scrollbar-thumb',
    scrollbar_track: '--color-scrollbar-track',
    btn_primary_bg: '--color-btn-primary',
    btn_primary_hover: '--color-btn-primary-hover',
    btn_secondary_bg: '--color-btn-secondary',
    btn_secondary_hover: '--color-btn-secondary-hover',
    input_bg: '--color-input-bg',
    input_border: '--color-input-border',
  };

  Object.entries(map).forEach(([key, cssVar]) => {
    if (settings[key]) {
      root.style.setProperty(cssVar, settings[key]);
      const rgb = hexToRgb(settings[key]);
      if (rgb) root.style.setProperty(cssVar + '-rgb', rgb);
    }
  });

  // Font settings
  if (settings.font_heading) root.style.setProperty('--font-heading', settings.font_heading);
  if (settings.font_body) root.style.setProperty('--font-body', settings.font_body);

  // Border radius
  if (settings.border_radius) root.style.setProperty('--border-radius', settings.border_radius + 'px');
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    settingsAPI.get()
      .then(res => {
        setSettings(res.data || {});
        applySettings(res.data || {});
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const refreshSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data || {});
      applySettings(res.data || {});
    } catch (e) {}
  };

  return (
    <SettingsContext.Provider value={{ settings, loaded, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
