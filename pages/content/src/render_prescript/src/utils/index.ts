// Re-export all utility functions
import { createLogger } from '@extension/shared/lib/logger';
import { clearCachedTheme, detectHostTheme, forceThemeMode, isDarkTheme } from './themeDetector';

const logger = createLogger('RenderPrescriptUtils');

export * from './dom';
export * from './performance';
export * from './themeDetector';

declare global {
  interface Window {
    themeControl?: {
      forceLight: () => void;
      forceDark: () => void;
      useSystem: () => void;
      reset: () => void;
      detect: () => { theme: string; isDark: boolean };
    };
  }
}

// Add a global utility for theme control that can be accessed from the console
if (typeof window !== 'undefined') {
  window.themeControl = {
    forceLight: () => {
      forceThemeMode('light');
      logger.debug('Forced light theme. Refresh the page to see changes.');
    },
    forceDark: () => {
      forceThemeMode('dark');
      logger.debug('Forced dark theme. Refresh the page to see changes.');
    },
    useSystem: () => {
      forceThemeMode('system');
      logger.debug('Using system theme preference. Refresh the page to see changes.');
    },
    reset: () => {
      clearCachedTheme();
      logger.debug('Theme detection reset. Refresh the page to see changes.');
    },
    detect: () => {
      const theme = detectHostTheme();
      const isDark = isDarkTheme();
      logger.debug(`Detected theme: ${theme}`);
      logger.debug(`Using ${isDark ? 'dark' : 'light'} theme`);
      return { theme, isDark };
    },
  };

  logger.debug('[Theme Detector] Global theme control available via window.themeControl');
}
