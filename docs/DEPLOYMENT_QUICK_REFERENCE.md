# Deployment Quick Reference

## Pre-Release Checklist (Quick Version)

```
[ ] npm run test:ci          # Tests pass
[ ] npm run lint             # No lint errors
[ ] tsc --noEmit             # TypeScript OK
[ ] Version bumped in app.config.ts, package.json
[ ] Git committed and tagged (e.g., git tag v1.0.1)
[ ] Code review approved
[ ] Environment variables configured
[ ] Staging tested successfully
[ ] All metrics green in monitoring
```

## Mobile App Deployment (EAS)

### Development Build
```bash
eas build --platform ios --profile development
eas build --platform android --profile development
# For internal testing on real devices
```

### Beta/Preview Build
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
# For TestFlight (iOS) and beta testing (Android)
```

### Production Build
```bash
eas build --platform ios --auto-submit
eas build --platform android --auto-submit
# Submits to App Store and Google Play
# Wait 24-48 hours for app review
```

### Monitor Build
```bash
eas build:list              # View all builds
eas build:view <build-id>   # View specific build logs
eas build:cancel <build-id> # Cancel a build
```

## Web Deployment

### Local Development
```bash
npm run web
# Starts http://localhost:3000
```

### Docker (Web)
```bash
docker build -t trovio-web:latest .
docker run -p 3000:3000 trovio-web:latest
# Access at http://localhost:3000
```

### Deploy to Railway
```bash
railway up
# Auto-deploys from Dockerfile
```

### Deploy to Render
1. Connect GitHub repo to render.com
2. Set build command: `docker build -t trovio .`
3. Auto-deploys on main branch push

## Emergency Procedures

### App Crash (P1)
```
1. Get error from Sentry/Crashlytics
2. Verify it's a blocker (many users affected)
3. Rollback: eas build:list → find last good build
4. Communicate to users
5. Create hotfix
```

### Database Issue (P1)
```
1. Alert database team
2. Check recent migrations
3. Rollback database migration
4. Test rollback
5. Redeploy app if needed
```

### Feature Broken (P2)
```
1. Create hotfix branch: git checkout -b hotfix/issue-name
2. Fix issue
3. Test locally
4. Commit and push
5. Create tag: git tag v1.0.1-hotfix
6. Deploy as above
```

### Performance Degradation (P2)
```
1. Check metrics in Vercel/mobile analytics
2. Identify slow endpoints/features
3. Check recent code changes
4. Rollback if necessary
5. Or disable feature with feature flag
```

## Status Commands

### Check Build Status
```bash
eas build:list              # EAS builds
docker images               # Docker images
```

### View Logs
```bash
eas build:view <build-id>   # EAS logs
docker logs <container-id>  # Docker logs
```

### Test Locally
```bash
npm run web                 # Web dev
npm run ios                 # iOS dev
npm run android             # Android dev
npm run test:ci             # All tests
```

## Monitoring Links

| Service | Purpose | URL |
|---------|---------|-----|
| Sentry | Error tracking | sentry.io (dashboard) |
| Crashlytics | Mobile crashes | firebase.google.com |
| Vercel | Web analytics | vercel.com/dashboard |
| App Store Connect | iOS status | appstoreconnect.apple.com |
| Google Play Console | Android status | play.google.com/console |

## Team Contacts

| Role | Escalation Path | Response |
|------|---|---|
| Issue Found | Support team | 24 hours |
| Technical | Engineering team | 1 hour |
| Blocking | Engineering Lead | 30 min |
| Critical | On-call engineer | 15 min |

## Version Numbering

**Format**: MAJOR.MINOR.PATCH (e.g., 1.0.1)

- **MAJOR**: Breaking changes (0→1)
- **MINOR**: New features (1→2)
- **PATCH**: Bug fixes (1→2)

## Release Channels

| Channel | Audience | Timeline | Risk |
|---------|----------|----------|------|
| Development | Developers | Immediate | High |
| Beta (TestFlight/Preview) | Early testers | 1-2 weeks | Medium |
| Production (5%) | 5% of users | 2-3 weeks | Low |
| Production (25%) | 25% of users | 3-5 weeks | Low |
| Production (100%) | All users | 5-7 weeks | Low |

## Key Metrics (Targets)

### Mobile Apps
- ✅ Crash Rate: < 0.1%
- ✅ Session Start: < 2s
- ✅ Error Rate: < 0.1%
- ✅ Retention (Day 1): > 30%

### Web
- ✅ Error Rate: < 0.1%
- ✅ Response Time: < 1s
- ✅ Page Load: < 2s
- ✅ Uptime: 99.9%

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| EAS build fails | `eas build:view <id>` for logs |
| Docker build fails | Check `docker build --progress=plain ...` |
| Tests fail | Run `npm run test:ci` locally first |
| Performance slow | Check metrics in monitoring tools |
| Users reporting crash | Check Sentry for error |

## Documentation References

| Document | Purpose |
|----------|---------|
| [Deployment Plan](./deployment-plan.md) | Strategy & process |
| [Release Checklist](./release-checklist.md) | Pre-release verification |
| [Support Plan](./support-plan.md) | Support procedures |
| [Deployment Guide](./deployment-guide.md) | Step-by-step instructions |
| [EAS Guide](./eas-deployment-guide.md) | Mobile app specifics |
| [Deployment Summary](./DEPLOYMENT_SUMMARY.md) | Overview |

---

**Print this page for quick reference during deployments**

**For detailed instructions, refer to the full documentation**

**Last Updated**: May 2026
