# SmartKenya App Versioning Guide

## 📦 Version System Overview

Your app uses **Semantic Versioning (SemVer)** with centralized version management across all platforms.

### Current Version System:
- **Version File**: `version.json` - Single source of truth
- **Format**: `MAJOR.MINOR.PATCH` (e.g., 1.0.0)
- **Build Numbers**: Auto-incremented for each release
- **Platforms**: Synchronized across iOS, Android, and package.json

### Version Components:
```
1.0.0
│ │ │
│ │ └─── PATCH: Bug fixes, minor changes (1.0.0 → 1.0.1)
│ └───── MINOR: New features, backwards compatible (1.0.0 → 1.1.0)
└─────── MAJOR: Breaking changes, major updates (1.0.0 → 2.0.0)
```

## 🚀 Quick Start Commands

### Bump Version (Recommended Workflow):

```bash
# Bug fixes and patches
npm run version:patch
# 1.0.0 → 1.0.1 (Build: 1 → 2)

# New features
npm run version:minor
# 1.0.0 → 1.1.0 (Build: 1 → 2)

# Major updates
npm run version:major
# 1.0.0 → 2.0.0 (Build: 1 → 2)

# Only increment build number (for resubmissions)
npm run version:build
# 1.0.0 → 1.0.0 (Build: 1 → 2)
```

### View Current Version:
```bash
npm run version:show
# Output: 1.0.0
```

### After Version Bump:
```bash
# Build and sync to native platforms
npm run build:production

# Or step by step:
npm run build
npx cap sync
```

## 📱 Platform-Specific Details

### iOS Versioning
```json
"ios": {
  "CFBundleShortVersionString": "1.0.0",  // User-facing version
  "CFBundleVersion": "1"                   // Build number
}
```

**Where it appears:**
- App Store listing
- TestFlight builds
- Device settings
- Xcode project settings

**Requirements:**
- CFBundleShortVersionString: Human-readable (e.g., "1.0.0")
- CFBundleVersion: Must increment for each upload
- Format: Numbers and periods only
- Must be unique for each App Store submission

### Android Versioning
```json
"android": {
  "versionName": "1.0.0",  // User-facing version
  "versionCode": 1          // Internal build number
}
```

**Where it appears:**
- Play Store listing
- APK/AAB metadata
- Device app info
- build.gradle (auto-synced)

**Requirements:**
- versionName: User-facing string (e.g., "1.0.0")
- versionCode: Integer, must increment for each upload
- versionCode must be unique and always increase
- Cannot downgrade versionCode in Play Store

## 🔄 Release Workflow

### 1. Pre-Release Checklist:
- [ ] All features tested and working
- [ ] No critical bugs remaining
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bump decided (patch/minor/major)

### 2. Version Bump:
```bash
# Example: Adding new features
npm run version:minor

# Output shows:
# 📱 App Version: 1.0.0 → 1.1.0
# 🔢 Build Number: 1 → 2
# 📦 iOS: 1.1.0 (2)
# 🤖 Android: 1.1.0 (2)
```

### 3. Update Changelog:
Edit `CHANGELOG.md` or `version.json` changelog:
```json
"changelog": {
  "1.1.0": {
    "date": "2025-01-20",
    "changes": [
      "Added push notifications",
      "Fixed checkout bug",
      "Improved performance"
    ]
  }
}
```

### 4. Commit and Tag:
```bash
# Add changes
git add .

# Commit with version
git commit -m "chore: bump version to v1.1.0"

# Create version tag
git tag v1.1.0

# Push with tags
git push origin main
git push origin v1.1.0
```

### 5. Build for Production:
```bash
# Build optimized bundle
npm run build

# Sync to native platforms
npx cap sync

# Open native IDEs for final checks
npm run cap:open:ios
npm run cap:open:android
```

### 6. Platform Submission:

**iOS (Xcode):**
1. Open `ios/App/App.xcworkspace`
2. Verify version in General tab matches
3. Select "Any iOS Device (arm64)"
4. Product → Archive
5. Upload to App Store Connect

**Android (Android Studio):**
1. Open `android/` folder
2. Build → Generate Signed Bundle/APK
3. Choose release configuration
4. Sign with your keystore
5. Upload to Play Console

## 📋 Version Strategy Guidelines

### When to Bump PATCH (1.0.0 → 1.0.1):
- Bug fixes
- Security patches
- Performance improvements
- UI tweaks
- Documentation updates

### When to Bump MINOR (1.0.0 → 1.1.0):
- New features (backwards compatible)
- New pages or sections
- Enhanced functionality
- New integrations
- Significant UI improvements

### When to Bump MAJOR (1.0.0 → 2.0.0):
- Breaking changes
- Complete redesign
- Major feature overhaul
- Database schema changes
- API version changes
- Removed features

### When to Bump BUILD Only:
- Resubmitting same version with hotfix
- Addressing store review feedback
- Certificate or signing issues
- Metadata-only updates

## 🎯 Best Practices

### Do's ✅:
- Always bump version before submitting to stores
- Keep version.json as single source of truth
- Update changelog with each version
- Use git tags for version tracking
- Test thoroughly before bumping version
- Follow semantic versioning strictly

### Don'ts ❌:
- Don't manually edit iOS/Android config files
- Don't skip version numbers
- Don't reuse build numbers
- Don't deploy without syncing to native platforms
- Don't forget to push tags to GitHub

## 🔧 Manual Version Management

If you need to manually set a version:

### Edit version.json:
```json
{
  "version": "2.0.0",
  "buildNumber": 50,
  "ios": {
    "CFBundleShortVersionString": "2.0.0",
    "CFBundleVersion": "50"
  },
  "android": {
    "versionName": "2.0.0",
    "versionCode": 50
  }
}
```

### Then sync:
```bash
# Update package.json manually or run:
npm version 2.0.0 --no-git-tag-version

# Rebuild and sync
npm run build:production
```

## 📊 Version History Tracking

### View Version History:
```bash
# See all version tags
git tag -l "v*"

# See changes between versions
git log v1.0.0..v1.1.0 --oneline

# View specific version details
git show v1.1.0
```

### Changelog Format:
Keep `CHANGELOG.md` updated:
```markdown
# Changelog

## [1.1.0] - 2025-01-20
### Added
- Push notification support
- Dark mode theme

### Fixed
- Checkout payment bug
- Image loading issues

### Changed
- Improved app performance
- Updated dependencies

## [1.0.0] - 2025-01-19
### Added
- Initial release
- Complete e-commerce platform
```

## 🚨 Troubleshooting

### Build Numbers Out of Sync:
```bash
# Check current versions
cat version.json

# If iOS/Android builds fail, ensure versions are synced:
npx cap sync ios
npx cap sync android
```

### Version Mismatch Errors:
1. Verify `version.json` is correct
2. Delete `node_modules/.cache`
3. Rebuild: `npm run build`
4. Sync: `npx cap sync`

### Store Rejection Due to Version:
```bash
# Increment build number only
npm run version:build

# Rebuild and resubmit
npm run build:production
```

### Rollback Version:
```bash
# Revert to previous version using git
git checkout v1.0.0 -- version.json package.json

# Or manually edit version.json and rebuild
```

## 📱 Store-Specific Requirements

### Apple App Store:
- CFBundleVersion must be unique per submission
- Can have multiple builds for same CFBundleShortVersionString
- TestFlight builds share version space with production
- Must increment for every upload (even rejections)

### Google Play Store:
- versionCode must always increase
- Cannot reuse or decrease versionCode
- Alpha/Beta/Production share versionCode space
- Must be integer (no decimals)

## 🎓 Learning Resources

- [Semantic Versioning Spec](https://semver.org/)
- [iOS Version Guidelines](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleversion)
- [Android Versioning Guide](https://developer.android.com/studio/publish/versioning)
- [Capacitor Config Documentation](https://capacitorjs.com/docs/config)

## 🔄 Automated Version Bumping (CI/CD)

For GitHub Actions or CI/CD pipelines:
```yaml
# .github/workflows/release.yml
- name: Bump version
  run: npm run version:${{ github.event.inputs.version_type }}
  
- name: Build app
  run: npm run build:production
  
- name: Create release
  uses: actions/create-release@v1
  with:
    tag_name: v${{ env.VERSION }}
```

## 📞 Quick Reference

| Action | Command | Example |
|--------|---------|---------|
| Bug fix release | `npm run version:patch` | 1.0.0 → 1.0.1 |
| Feature release | `npm run version:minor` | 1.0.0 → 1.1.0 |
| Major release | `npm run version:major` | 1.0.0 → 2.0.0 |
| Rebuild only | `npm run version:build` | Build: 1 → 2 |
| Check version | `npm run version:show` | Displays: 1.0.0 |
| Build production | `npm run build:production` | Build + sync |

---

**Remember:** Consistent versioning is crucial for app store submissions and user trust. Always follow the workflow! 🚀
