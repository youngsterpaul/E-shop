# Package.json Updates Required

After exporting to GitHub, update your `package.json` with these changes:

## 1. Update Package Name and Version

Change these lines at the top of package.json:
```json
{
  "name": "smartkenya-mobile-app",
  "private": true,
  "version": "1.0.0",
```

## 2. Add Version Management Scripts

Add these scripts to the "scripts" section:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "build:production": "vite build && npx cap sync",
  "lint": "eslint .",
  "preview": "vite preview",
  "version:patch": "node scripts/version-bump.js patch",
  "version:minor": "node scripts/version-bump.js minor",
  "version:major": "node scripts/version-bump.js major",
  "version:build": "node scripts/version-bump.js build",
  "version:show": "node -p \"require('./version.json').version\"",
  "cap:sync": "npx cap sync",
  "cap:open:ios": "npx cap open ios",
  "cap:open:android": "npx cap open android"
}
```

## 3. Complete Updated package.json Scripts Section

Your complete scripts section should look like this:
```json
{
  "name": "smartkenya-mobile-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "build:production": "vite build && npx cap sync",
    "lint": "eslint .",
    "preview": "vite preview",
    "version:patch": "node scripts/version-bump.js patch",
    "version:minor": "node scripts/version-bump.js minor",
    "version:major": "node scripts/version-bump.js major",
    "version:build": "node scripts/version-bump.js build",
    "version:show": "node -p \"require('./version.json').version\"",
    "cap:sync": "npx cap sync",
    "cap:open:ios": "npx cap open ios",
    "cap:open:android": "npx cap open android"
  },
  "dependencies": {
    "@capacitor/android": "^5.7.0",
    "@capacitor/app": "^5.0.7",
    "@capacitor/core": "^5.0.7",
    "@capacitor/haptics": "^5.0.7",
    "@capacitor/ios": "^5.7.0",
    "@capacitor/keyboard": "^5.0.7",
    "@capacitor/status-bar": "^5.0.7",
    "@supabase/supabase-js": "^2.40.0",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.35",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4"
  }
}
```

## After Making These Changes:

```bash
# Test the version commands
npm run version:show

# Try a version bump (this will update version.json)
npm run version:patch

# Build for production
npm run build:production
```

These scripts enable you to easily manage your app versions for iOS and Android app store releases!
