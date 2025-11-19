import { CapacitorConfig } from '@capacitor/cli';

// Import version from centralized version file
const version = require('./version.json');

const config: CapacitorConfig = {
  appId: 'app.lovable.217afeeccc2c49b994a59c42e297d8fb',
  appName: 'SmartKenya',
  webDir: 'dist',
  version: version.version,
  buildNumber: version.buildNumber.toString(),
  server: {
    url: 'https://217afeec-cc2c-49b9-94a5-9c42e297d8fb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#f97316',
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
