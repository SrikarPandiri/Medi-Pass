/**
 * @file client/js/shared/theme.js
 * @description Theme manager supporting Light, Dark, and System modes.
 * Avoids theme flash before first paint by persisting preference in localStorage.
 */

export class ThemeManager {
  static STORAGE_KEY = 'medipass_theme_pref';

  static init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'system';
    this.applyTheme(saved);

    // Listen to OS theme changes if on system
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.getTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  static getTheme() {
    return localStorage.getItem(this.STORAGE_KEY) || 'system';
  }

  static applyTheme(theme) {
    localStorage.setItem(this.STORAGE_KEY, theme);
    const root = document.documentElement;

    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      // System
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }

    window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme } }));
  }

  static toggle() {
    const current = this.getTheme();
    const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    this.applyTheme(next);
    return next;
  }
}

// Auto-run on module import
ThemeManager.init();
export default ThemeManager;
