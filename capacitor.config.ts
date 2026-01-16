import { CapacitorConfig } from '@capacitor/cli';

// Import version from centralized version file
const version = require('./version.json');

const config: CapacitorConfig = {
  appId: 'ke.co.smartkenya',
  appName: 'SmartKenya',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#16a34a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
