import { CapacitorConfig } from '@capacitor/cli';

const version = require('./version.json');

const config: CapacitorConfig = {
  appId: 'com.smartkenya.app',
  appName: 'SmartKenya',
  webDir: 'dist',

  android: {
    allowMixedContent: true,
    backgroundColor: '#16a34a',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#16a34a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },

    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#16a34a',
      overlaysWebView: false,
    },
    
    // Browser plugin for OAuth
    Browser: {
      windowName: '_self',
    },
  },
};

export default config;
