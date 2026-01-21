import { CapacitorConfig } from '@capacitor/cli';

const version = require('./version.json');

const config: CapacitorConfig = {
  appId: 'com.smartkenya.app',
  appName: 'SmartKenya',
  webDir: 'dist',

  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#16a34a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,

      // ❌ IMPORTANT: do NOT use immersive mode
      splashFullScreen: false,
      splashImmersive: false,
    },

    StatusBar: {
      style: 'LIGHT',          // Icons visible
      backgroundColor: '#16a34a',
      overlaysWebView: false,  // ✅ KEY FIX (no overlay)
    },
  },
};

export default config;
