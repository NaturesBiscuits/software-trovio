# Deployment Guide

This guide walks through deploying the Trovio application to a production environment.

## Prerequisites

1. **Node.js 18+** installed
2. **npm** or **yarn** package manager
3. **Vercel CLI** (for command-line deployment):
   ```bash
   npm install -g vercel
   ```
4. **Git** with proper setup for pushing changes
5. Environment variables configured locally

## Deployment Platforms

### Option 1: EAS (Recommended for Mobile Apps)

EAS (Expo Application Services) is the official deployment platform for Expo apps. Perfect for building and submitting iOS and Android apps.

#### Setup EAS

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS**
   ```bash
   eas login
   # Enter your Expo account credentials
   ```

3. **Link to EAS Project**
   ```bash
   eas project:create
   # Follow prompts to create a new project
   ```

4. **Configure eas.json** (already configured in this project)
   ```json
   {
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
       "production": {}
     }
   }
   ```

#### Build with EAS

**Development Build** (for testing)
```bash
eas build --platform ios --profile development
eas build --platform android --profile development
# Download APK/IPA and install locally
```

**Preview Build** (for stakeholder testing)
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
# Can distribute via TestFlight (iOS) or internal sharing (Android)
```

**Production Build** (app store submission)
```bash
# iOS
eas build --platform ios --auto-submit
# Opens TestFlight for review, then automatically submits to App Store

# Android
eas build --platform android --auto-submit
# Automatically submits to Google Play Console
```

#### Monitor EAS Builds

```bash
# View build status
eas build:list

# View build logs
eas build:view <build-id>

# Cancel a build
eas build:cancel <build-id>
```

### Option 2: Local Web Development

For development and testing the web version locally:

```bash
# Start development server
npm run web

# This opens http://localhost:3000 in your browser
# Hot reload is enabled - changes update automatically
```

### Option 3: Docker Deployment (for Web)

Deploy the web app using Docker for self-hosted or cloud environments:

1. **Create Dockerfile** (create in root directory)
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   ENV EXPO_ROUTER_APP_ROOT=app
   RUN npm run build:web

   FROM node:18-alpine
   WORKDIR /app
   RUN npm install -g serve
   COPY --from=builder /app/web-build ./web-build
   EXPOSE 3000
   CMD ["serve", "-s", "web-build", "-l", "3000"]
   ```

2. **Create .dockerignore**
   ```
   node_modules
   npm-debug.log
   .git
   .env
   .env.local
   .DS_Store
   web-build
   coverage
   ```

3. **Build Docker Image**
   ```bash
   docker build -t trovio-web:latest .
   ```

4. **Run Locally**
   ```bash
   docker run -p 3000:3000 trovio-web:latest
   # Access at http://localhost:3000
   ```

5. **Deploy to Railway/Render**
   - Connect GitHub repository
   - Link Dockerfile
   - Set environment variables
   - Deploy automatically on push

### Option 4: Railway

Railway is great for containerized apps with database support.

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Setup Railway Project**
   ```bash
   railway init
   railway link <project-id>
   ```

3. **Deploy with Docker**
   ```bash
   railway up
   ```

### Option 5: Render

Similar to Railway, good for full-stack apps.

1. **Create Account** at [render.com](https://render.com)
2. **Create New Web Service**
   - Connect GitHub account
   - Select repository
   - Build Command: `docker build -t trovio .`
   - Start Command: `docker run -p 3000:3000 trovio`
   - Plan: Free tier (limited) or Starter

3. **Set Environment Variables**
   - Settings → Environment
   - Add all required variables

4. **Deploy** (automatic on push to main)

## Local Development & Testing

### 1. Verify Tests Pass
```bash
npm run test:ci
```

### 2. Lint & Type Check
```bash
npm run lint
tsc --noEmit
```

### 3. Test on Mobile Apps

#### iOS (Development)
```bash
npm run ios
```

#### Android (Development)
```bash
npm run android
```

#### Web (Development)
```bash
npm run web
# Starts development server on http://localhost:3000
# Hot reload enabled - changes update automatically
```

### 4. Build Mobile Apps for EAS

```bash
# Development build (for testing)
eas build --platform ios --profile development
eas build --platform android --profile development

# Preview build (for stakeholder testing)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production build (for app stores)
eas build --platform ios --auto-submit
eas build --platform android --auto-submit
```

### 5. Build Web with Docker

```bash
# Build Docker image
docker build -t trovio-web:latest .

# Run locally for testing
docker run -p 3000:3000 trovio-web:latest
```

## Deployment Checklist

Before deploying to production, verify:

- [ ] All tests passing: `npm run test:ci`
- [ ] Linting passes: `npm run lint`
- [ ] TypeScript compiles: `tsc --noEmit`
- [ ] Mobile apps build successfully: `eas build --dry-run`
- [ ] Environment variables configured in EAS
- [ ] Git branch is up to date with main
- [ ] Code review approved
- [ ] App screenshots and descriptions updated in app stores
- [ ] Privacy policy and terms of service updated
- [ ] Crash reporting configured (Sentry)
- [ ] Analytics configured
- [ ] All feature flags configured correctly

## Troubleshooting Deployment

## Troubleshooting Deployment

### EAS Build Fails

1. **Check Node & CLI Version**
   ```bash
   node --version       # Should be 18+
   npm --version        # Should be 10+
   eas --version        # Should be 16+
   ```

2. **Clear Cache & Reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   eas build --dry-run
   ```

3. **View Build Logs**
   ```bash
   eas build:list
   eas build:view <build-id>
   # Shows detailed logs of any failures
   ```

4. **Common EAS Issues**
   - Not logged in: `eas login`
   - Project not linked: `eas project:create`
   - Invalid eas.json: Verify syntax and settings
   - Missing certificates: Follow EAS setup wizard

### App Crashes After Deployment

1. **Check Error Logs**
   - Mobile: Use Sentry dashboard or Bugsnag
   - Web: Browser console (F12)
   - Expo DevTools: Connect to development build

2. **Common Issues**
   - Missing environment variables
   - API endpoint not accessible
   - Database connection failed
   - Incompatible dependency version

3. **Rollback Strategy**
   - Stop distributing current version
   - Submit previous version to app stores
   - Use feature flags to disable broken features
   - Submit hotfix build

### Web Build Issues

1. **Docker Build Fails**
   ```bash
   # Check for syntax errors
   docker build --progress=plain -t trovio-web:latest .
   
   # View detailed output
   docker build --no-cache -t trovio-web:latest .
   ```

2. **Runtime Issues**
   - Missing environment variables in runtime
   - Port already in use
   - Out of memory

## Post-Deployment

### 1. Verify Production Works
- [ ] Open app on iOS device
- [ ] Open app on Android device
- [ ] Test authentication flow
- [ ] Test main features
- [ ] Check API endpoints
- [ ] Verify database connectivity

### 2. Monitor Metrics
- Crash rate (target: < 0.1%)
- App performance (target: < 2s start time)
- API response times (target: < 1s)
- User engagement metrics
- User sessions and engagement

### 3. Gather Feedback
- Monitor support channels
- Check user reports
- Collect analytics data
- Plan improvements

## Current Deployment Status

### Build Configuration Issue (Known Limitation)

The web build currently has a configuration issue with expo-router's dynamic routing on webpack. To work around this:

**Workaround 1: Deploy Mobile Apps via EAS** (Recommended)
```bash
eas build --platform ios --auto-submit
eas build --platform android --auto-submit
```

**Workaround 2: Use Local Development**
```bash
npm run web  # Runs development server on localhost:3000
```

**Workaround 3: Docker Deployment**
Use the Docker approach to containerize and deploy the application.

| Environment | Platform | Status | URL |
|---|---|---|---|
| Mobile (iOS) | EAS Build + App Store | 🔴 Not deployed | TBD |
| Mobile (Android) | EAS Build + Google Play | 🔴 Not deployed | TBD |
| Web Dev | Local | ✅ Ready | localhost:3000 |
| Web Prod | Docker / Railway | ⏳ Configurable | TBD |

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Expo Web Guide](https://docs.expo.dev/guides/web/)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Deployment Plan](./deployment-plan.md)
- [Release Checklist](./release-checklist.md)
- [Support Plan](./support-plan.md)
