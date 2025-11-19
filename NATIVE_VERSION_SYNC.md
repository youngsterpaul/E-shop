# Native Platform Version Synchronization

## 📱 How Version Sync Works

Your app uses `version.json` as the single source of truth. When you run `npx cap sync`, Capacitor automatically updates native platform files.

## 🍎 iOS Version Configuration

### Files Updated Automatically:
1. **Info.plist** (`ios/App/App/Info.plist`)
   ```xml
   <key>CFBundleShortVersionString</key>
   <string>1.0.0</string>
   <key>CFBundleVersion</key>
   <string>1</string>
   ```

### Where Versions Appear:
- Xcode project settings (General tab)
- App Store Connect
- TestFlight
- Device Settings → General → About

### Manual Verification in Xcode:
1. Open: `ios/App/App.xcworkspace`
2. Select project in Navigator
3. Select "App" target
4. Check General tab:
   - **Version**: Should match `CFBundleShortVersionString`
   - **Build**: Should match `CFBundleVersion`

### If Version Doesn't Sync:
```bash
# Force sync iOS
npx cap sync ios

# Or update iOS specifically
npx cap update ios

# Clean build (in Xcode)
# Product → Clean Build Folder (Shift+Cmd+K)
```

## 🤖 Android Version Configuration

### Files Updated Automatically:
1. **build.gradle** (`android/app/build.gradle`)
   ```gradle
   android {
       defaultConfig {
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

### Where Versions Appear:
- Android Studio project settings
- Google Play Console
- APK/AAB manifest
- Device Settings → Apps → App Info

### Manual Verification in Android Studio:
1. Open: `android/` folder
2. Open: `app/build.gradle`
3. Find `defaultConfig` section
4. Verify:
   - **versionCode**: Should match `version.json` buildNumber
   - **versionName**: Should match `version.json` version

### If Version Doesn't Sync:
```bash
# Force sync Android
npx cap sync android

# Or update Android specifically
npx cap update android

# Clean build (in Android Studio)
# Build → Clean Project
# Build → Rebuild Project
```

## 🔄 Sync Workflow

### Standard Sync Process:
```bash
# 1. Bump version
npm run version:minor

# 2. Build web assets
npm run build

# 3. Sync to native platforms
npx cap sync

# This updates:
# - iOS Info.plist
# - Android build.gradle
# - Web assets in native projects
```

### What Gets Synced:
- ✅ Version numbers (from version.json)
- ✅ Build numbers (from version.json)
- ✅ Web assets (from dist/)
- ✅ Capacitor plugins
- ✅ Native dependencies
- ❌ Native code (requires manual changes)
- ❌ Signing certificates
- ❌ App icons (use @capacitor/assets)

## 🎯 Version Validation

### Pre-Submission Checks:

**iOS Checklist:**
```bash
# 1. Check version.json
cat version.json | grep version

# 2. Sync to iOS
npx cap sync ios

# 3. Open Xcode and verify
npx cap open ios

# 4. In Xcode, check:
# - General → Version matches
# - General → Build matches
# - Archive and check version in Organizer
```

**Android Checklist:**
```bash
# 1. Check version.json
cat version.json | grep version

# 2. Sync to Android
npx cap sync android

# 3. Open Android Studio and verify
npx cap open android

# 4. In Android Studio:
# - Open app/build.gradle
# - Verify versionCode and versionName
# - Build → Generate Signed Bundle
# - Check version in generated APK/AAB
```

## 🚨 Common Issues

### Issue: iOS version not updating in Xcode
**Solution:**
```bash
# 1. Clean iOS build
cd ios
rm -rf App/App.xcarchive
pod deintegrate
pod install
cd ..

# 2. Re-sync
npx cap sync ios

# 3. Clean in Xcode
# Product → Clean Build Folder
```

### Issue: Android versionCode not incrementing
**Solution:**
```bash
# 1. Increment build number
npm run version:build

# 2. Sync Android
npx cap sync android

# 3. In Android Studio:
# Build → Clean Project
# Build → Rebuild Project
```

### Issue: Build rejected due to duplicate version
**Solution:**
```bash
# Never reuse build numbers!
npm run version:build  # This increments build number
npm run build
npx cap sync

# Verify it increased:
cat version.json | grep buildNumber
```

### Issue: Different versions on iOS vs Android
**Solution:**
```bash
# Should never happen with version.json system
# But if it does:

# 1. Check source of truth
cat version.json

# 2. Force sync both platforms
npx cap sync

# 3. Manually verify:
# iOS: ios/App/App/Info.plist
# Android: android/app/build.gradle
```

## 📋 Manual Override (Emergency Only)

If automatic sync fails completely, you can manually update:

### iOS (Info.plist):
```bash
# Edit: ios/App/App/Info.plist
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

### Android (build.gradle):
```bash
# Edit: android/app/build.gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

**⚠️ Warning:** Manual changes will be overwritten on next `npx cap sync`. Always update `version.json` first!

## 🔍 Debugging Version Issues

### Check Current Versions:
```bash
# Source of truth
cat version.json

# iOS (requires macOS)
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" ios/App/App/Info.plist

# Android
grep versionName android/app/build.gradle
grep versionCode android/app/build.gradle
```

### Verify Sync Status:
```bash
# Check if platforms exist
ls -la ios/
ls -la android/

# Check if web assets are built
ls -la dist/

# Check last sync time
npx cap doctor
```

## 📊 Version Tracking

### Git Tags for Versions:
```bash
# Create version tag after bump
npm run version:minor
git add .
git commit -m "chore: bump to v1.1.0"
git tag v1.1.0
git push origin main --tags

# List all version tags
git tag -l "v*"

# Checkout specific version
git checkout v1.0.0
```

### Compare Versions:
```bash
# See what changed between versions
git diff v1.0.0..v1.1.0

# See version history
git log --oneline --decorate --tags
```

## 🎓 Best Practices

1. **Always use version.json**: Never manually edit platform files
2. **Sync after every version bump**: `npm run build:production`
3. **Verify before submission**: Check both Xcode and Android Studio
4. **Keep build numbers sequential**: Never skip or reuse
5. **Tag your releases**: Use git tags for tracking
6. **Test on real devices**: Emulators may cache old versions
7. **Document changes**: Update CHANGELOG.md with each version

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Bump version | `npm run version:minor` |
| Sync to native | `npx cap sync` |
| Sync iOS only | `npx cap sync ios` |
| Sync Android only | `npx cap sync android` |
| Check version | `npm run version:show` |
| Open Xcode | `npx cap open ios` |
| Open Android Studio | `npx cap open android` |
| Verify sync | `npx cap doctor` |

---

**Remember:** The version sync is automatic, but you must run `npx cap sync` after bumping versions! 🔄
