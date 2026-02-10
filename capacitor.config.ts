import { CapacitorConfig } from '@capacitor/cli';

const version = require('./version.json');

const config: CapacitorConfig = {
  appId: 'com.smartkenya.app',
  appName: 'SmartKenya',
  webDir: 'dist',

  android: {
    allowMixedContent: true,
    backgroundColor: '#FFFFFF',
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#16a34a',
      overlaysWebView: false,
    },
  },
};

export default config;
