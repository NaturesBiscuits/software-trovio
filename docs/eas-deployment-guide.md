# EAS Deployment Guide

This guide walks through deploying the Trovio mobile app to iOS App Store and Google Play using Expo Application Services (EAS).

## Prerequisites

1. **Expo Account**
   - Create at [expo.dev](https://expo.dev)
   - Verify email

2. **EAS CLI**
   ```bash
   npm install -g eas-cli
   eas login
   ```

3. **App Store Accounts**
   - Apple Developer Account ($99/year)
   - Google Play Developer Account ($25 one-time)

4. **Git Repository**
   - All code committed and pushed
   - Clean working directory

## Initial Setup

### Step 1: Link EAS Project

```bash
# From project root
eas project:create
# Follow prompts to create or link existing project
```

This creates a `.easrc` file with your project credentials.

### Step 2: Configure app.json

The `app.config.ts` already has basic configuration. Update as needed:

```typescript
export default {
  name: 'trovio-app',
  slug: 'trovio-app',
  version: '1.0.0',
  
  // iOS configuration
  ios: {
    bundleIdentifier: 'com.trovio.app',
    buildNumber: '1',
    infoPlist: {
      NSUserTrackingUsageDescription: 'We use tracking to...',
    }
  },
  
  // Android configuration
  android: {
    package: 'com.trovio.app',
    versionCode: 1,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.LOCATION_FINE',
      'android.permission.LOCATION_COARSE'
    ]
  }
};
```

### Step 3: Configure eas.json

Update `eas.json` with build profiles:

```json
{
  "cli": {
    "version": ">= 16.28.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_ASC_APP_ID"
      }
    }
  }
}
```

## iOS Deployment

### Step 1: Create Apple Developer Account

1. Go to [developer.apple.com](https://developer.apple.com)
2. Enroll in Apple Developer Program ($99/year)
3. Create App ID in App Store Connect
4. Create signing certificates and provisioning profiles

### Step 2: Configure iOS Build

```bash
# EAS will guide you through certificate setup
eas build --platform ios --profile production
```

Follow prompts:
- [ ] Create new Apple Developer credentials
- [ ] Create App Store Connect API key
- [ ] Choose certificate type (automatically generated)

### Step 3: Create App Store Listing

In [App Store Connect](https://appstoreconnect.apple.com):

1. Create new app (Bundle ID: `com.trovio.app`)
2. Fill in app information:
   - [ ] Name
   - [ ] Subtitle
   - [ ] Description (4000 char max)
   - [ ] Keywords
   - [ ] Support URL
   - [ ] Privacy Policy URL
3. Add screenshots (at least 2 per device type):
   - [ ] iPhone 5.5" (1242 x 2208)
   - [ ] iPad 12.9" (2048 x 2732)
4. Set pricing (free or premium)
5. Configure app category
6. Add app review information

### Step 4: Build for App Store

```bash
eas build --platform ios --profile production --auto-submit
```

This will:
- Build the app
- Create provisioning profile
- Create certificates
- Archive and submit to TestFlight
- Available for app review

### Step 5: App Review Process

1. TestFlight shows "Pending Review"
2. Apple reviews app (typically 24-48 hours)
3. Feedback in App Store Connect
4. Fix any issues and resubmit

## Android Deployment

### Step 1: Create Google Play Account

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create developer account ($25 one-time)
3. Accept agreements and policies

### Step 2: Configure Android Build

```bash
# EAS will guide you through keystore setup
eas build --platform android --profile production
```

Follow prompts:
- [ ] Create new Android keystore
- [ ] Generate signing key
- [ ] Save keystore securely

### Step 3: Create Play Store Listing

In [Google Play Console](https://play.google.com/console):

1. Create new app (Package: `com.trovio.app`)
2. Fill in app information:
   - [ ] Title (50 char max)
   - [ ] Short description (80 char max)
   - [ ] Full description (4000 char max)
   - [ ] Category
   - [ ] Content rating (fill questionnaire)
   - [ ] Target audience
3. Add app graphics:
   - [ ] App icon (512×512)
   - [ ] Feature graphic (1024×500)
   - [ ] Screenshots (at least 2, max 8)
   - [ ] Video link (optional)
4. Set pricing (free or premium)
5. Add privacy policy URL

### Step 4: Build for Play Store

```bash
eas build --platform android --profile production --auto-submit
```

This will:
- Build the app
- Sign with keystore
- Generate Play Bundle (AAB)
- Submit to Play Store

### Step 5: Release Process

In Google Play Console:

1. Go to Internal Testing track
2. Review build details
3. Move to Closed Testing (optional)
4. Move to Production
5. Configure rollout percentage (start at 5-10%, increase to 100%)

## Version Management

### Update Version Numbers

Before each release:

```bash
# Update in app.config.ts
version: '1.0.1'

# For iOS
ios: {
  buildNumber: '2'
}

# For Android
android: {
  versionCode: 2
}
```

Then commit and tag:

```bash
git commit -am "Release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### Semantic Versioning

- **MAJOR.MINOR.PATCH** (e.g., 1.0.1)
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

## Monitoring

### In-App Feedback

1. Firebase Crashlytics monitors crashes
2. Sentry tracks errors
3. LogRocket records sessions

### Store Reviews

- Check App Store Connect for user reviews
- Respond to negative reviews quickly
- Track version-specific issues

### Analytics

Monitor:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Crash-free user rate
- Retention rates

## Troubleshooting

### Build Fails

```bash
# Clear EAS cache
eas build --clean

# View detailed logs
eas build:view <build-id>

# Check dependencies
npm install --legacy-peer-deps
```

### Submission Fails

Common issues:
- Outdated certificates
- Missing privacy policy
- Invalid screenshots dimensions
- Insufficient app review information

Solution:
- Review error message in App Store Connect
- Update app listing
- Submit again

### App Rejected

If app is rejected:
1. Read rejection reason carefully
2. Make required changes
3. Resubmit with explanation

Common rejection reasons:
- Privacy policy issues
- Inappropriate content
- Crash on app launch
- Misleading functionality

## Updates & Maintenance

### Push Updates

For critical updates:

```bash
eas update
# Push OTA (Over-The-Air) update
# Users get update within 15 minutes
```

### Build Update

For changes requiring app store resubmission:

```bash
# Increment version
# Create release branch
git checkout -b release/v1.0.2

# Make changes and test
npm run test
npm run lint

# Create PR for review
# Merge to main
# Create release tag
git tag v1.0.2

# Build and submit
eas build --platform ios --profile production --auto-submit
eas build --platform android --profile production --auto-submit
```

## Rollback

If critical issue found:

```bash
# Stop current rollout in Play Store/App Store
# Revert to previous version in console
# Disable new features with feature flags
# Create hotfix branch

git checkout -b hotfix/critical-fix
# Fix issue
git commit -am "Fix critical issue"
git tag v1.0.1-hotfix

# Build and submit
eas build --platform ios --profile production --auto-submit
```

## Support & Documentation

- [EAS Documentation](https://docs.expo.dev/eas/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Deployment Plan](./deployment-plan.md)
- [Release Checklist](./release-checklist.md)
- [Support Plan](./support-plan.md)

---

**Last Updated**: May 2026
**Next Review**: August 2026
