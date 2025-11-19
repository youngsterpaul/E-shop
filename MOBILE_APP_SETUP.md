# SmartKenya Mobile App Setup Guide

## 🎉 Capacitor Configuration Complete!

Your app is now configured for native iOS and Android deployment to the Apple App Store and Google Play Store.

## 📱 What's Been Set Up

✅ Capacitor Core, iOS, and Android packages installed
✅ Capacitor configuration with hot-reload enabled
✅ Mobile-optimized meta tags and PWA support
✅ Splash screen configuration (orange theme matching your brand)
✅ App ID: `app.lovable.217afeeccc2c49b994a59c42e297d8fb`
✅ App Name: `SmartKenya`

## 🚀 Next Steps to Build Your App

### Step 1: Export to GitHub
1. Click the **"Export to GitHub"** button in Lovable (top right)
2. Connect your GitHub account if you haven't already
3. Create a new repository or push to an existing one

### Step 2: Clone and Setup Locally
```bash
# Clone your repository
git clone <your-github-repo-url>
cd <your-repo-name>

# Install dependencies
npm install

# Build the web assets
npm run build
```

### Step 3: Add iOS and Android Platforms

**For iOS (requires Mac with Xcode):**
```bash
npx cap add ios
npx cap update ios
npx cap sync ios
```

**For Android (requires Android Studio):**
```bash
npx cap add android
npx cap update android
npx cap sync android
```

### Step 4: Run on Device/Emulator

**iOS:**
```bash
npx cap run ios
```
This will open Xcode where you can:
- Select your device/simulator
- Click the Play button to build and run

**Android:**
```bash
npx cap run android
```
This will open Android Studio where you can:
- Select your device/emulator
- Click the Run button to build and run

## 🔄 Development Workflow

### Hot Reload During Development
Your app is configured to connect to the Lovable sandbox, so you can test changes instantly:

1. Make changes in Lovable
2. Changes appear automatically on your device (no rebuild needed)
3. Once you're happy, rebuild for production

### When to Sync
Run `npx cap sync` after:
- Installing new Capacitor plugins
- Making changes to native configurations
- Pulling updates from GitHub

## 📦 Building for Production

### Before Building:
1. Update `capacitor.config.ts` - **Remove or comment out the `server` section**:
```typescript
// server: {
//   url: 'https://217afeec-cc2c-49b9-94a5-9c42e297d8fb.lovableproject.com?forceHideBadge=true',
//   cleartext: true
// },
```

2. Build optimized production bundle:
```bash
npm run build
npx cap sync
```

### iOS App Store Submission:
1. Open `ios/App/App.xcworkspace` in Xcode
2. Configure signing & capabilities with your Apple Developer account
3. Set your Bundle Identifier (update in Xcode and `capacitor.config.ts`)
4. Update version and build number
5. Archive → Upload to App Store Connect
6. Submit for review

### Android Play Store Submission:
1. Open `android/` folder in Android Studio
2. Generate signed APK/AAB:
   - Build → Generate Signed Bundle/APK
   - Create keystore or use existing
   - Build release version
3. Upload to Google Play Console
4. Complete store listing
5. Submit for review

## 🎨 Customizing Your App

### App Icons & Splash Screens
Custom SmartKenya icons and splash screens have been generated!

**Automatic Generation:**
```bash
# Generate all platform-specific icons and splash screens
npx @capacitor/assets generate --iconBackgroundColor '#f97316' --splashBackgroundColor '#f97316'
```

This creates all required sizes for iOS and Android from your source files:
- Source Icon: `public/app-icon.png` (1024x1024)
- Source Splash: `public/splash-screen.png` (1080x1920)
- Config: `assets.config.json`

**📖 See `APP_ICONS_SETUP.md` for complete customization guide**

### Splash Screen
Update the `SplashScreen` plugin config in `capacitor.config.ts`:
- `backgroundColor`: Your brand color
- `launchShowDuration`: How long to show splash

### App Name & ID
In `capacitor.config.ts`:
- `appName`: Display name on device
- `appId`: Unique identifier (reverse domain format)

## 🔧 Troubleshooting

### iOS Build Issues
- Ensure Xcode is up to date
- Check signing certificates in Xcode
- Clean build folder: Product → Clean Build Folder

### Android Build Issues
- Update Android Studio and SDK tools
- Check `android/app/build.gradle` for minimum SDK version
- Invalidate caches: File → Invalidate Caches / Restart

### Sync Issues
```bash
# Force clean and rebuild
rm -rf node_modules
npm install
npm run build
npx cap sync
```

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Deployment Guide](https://capacitorjs.com/docs/ios/deploying-to-app-store)
- [Android Deployment Guide](https://capacitorjs.com/docs/android/deploying-to-google-play)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

## 🆘 Need Help?

If you encounter issues:
1. Check the [Capacitor Community](https://github.com/ionic-team/capacitor/discussions)
2. Review [Common Issues](https://capacitorjs.com/docs/troubleshooting)
3. Ask in the [Lovable Discord](https://discord.gg/lovable)

## ✨ Next Features to Consider

- Push notifications (@capacitor/push-notifications)
- Camera integration (@capacitor/camera)
- Geolocation (@capacitor/geolocation)
- In-app purchases (@capacitor/purchases)
- Local notifications (@capacitor/local-notifications)

---

**Important:** Before submitting to app stores, thoroughly test all functionality on real devices and review store guidelines:
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Store Guidelines](https://play.google.com/about/developer-content-policy/)
