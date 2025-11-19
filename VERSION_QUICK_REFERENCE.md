# Version Management Quick Reference Card

## 🚀 Quick Commands

```bash
# View current version
npm run version:show

# Bug fixes (1.0.0 → 1.0.1)
npm run version:patch

# New features (1.0.0 → 1.1.0)
npm run version:minor

# Major updates (1.0.0 → 2.0.0)
npm run version:major

# Build number only (1.0.0 build 1 → 1.0.0 build 2)
npm run version:build

# Build for stores
npm run build:production
```

## 📋 Release Checklist

- [ ] Test all features
- [ ] Update CHANGELOG.md
- [ ] Run version bump command
- [ ] Commit changes: `git add . && git commit -m "chore: v1.x.x"`
- [ ] Create tag: `git tag v1.x.x`
- [ ] Build: `npm run build:production`
- [ ] Push: `git push && git push --tags`
- [ ] Submit to stores

## 📱 Current Version Info

**Location**: `version.json`

```json
{
  "version": "1.0.0",           // User-facing version
  "buildNumber": 1,              // Increments with each release
  "ios": {
    "CFBundleShortVersionString": "1.0.0",
    "CFBundleVersion": "1"
  },
  "android": {
    "versionName": "1.0.0",
    "versionCode": 1
  }
}
```

## 🎯 When to Use Each Version Type

| Type | Use For | Example |
|------|---------|---------|
| **patch** | Bug fixes, hotfixes | 1.0.0 → 1.0.1 |
| **minor** | New features | 1.0.0 → 1.1.0 |
| **major** | Breaking changes | 1.0.0 → 2.0.0 |
| **build** | Resubmit same version | Build: 1 → 2 |

## 🔧 Troubleshooting

### Version not updating in app?
```bash
npm run build
npx cap sync
```

### Build rejected by store?
```bash
npm run version:build  # Increment build number
npm run build:production
```

### Need to check what changed?
```bash
git diff version.json
cat CHANGELOG.md
```

## 📖 Full Documentation

See `APP_VERSIONING_GUIDE.md` for complete details.
