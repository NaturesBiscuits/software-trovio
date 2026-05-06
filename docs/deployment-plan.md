# Deployment Plan

## Overview
This document outlines the deployment strategy, target environments, and rollback procedures for the Trovio app system.

## Target Environments

### Development Environment
- **Platform**: Expo Go / Local Development
- **Purpose**: Testing new features and debugging
- **Command**: `npm run web` (for web) or `npm start` (for mobile)
- **Access**: Local machine only

### Staging Environment (Preview)
- **Platform**: Vercel
- **Purpose**: Pre-production testing and acceptance testing
- **URL**: https://trovio-staging.vercel.app
- **Branch**: `develop`
- **Auto-deploy**: Yes (on push to develop)

### Production Environment
- **Platform**: Vercel
- **Purpose**: Live application for users
- **URL**: https://trovio.app (custom domain)
- **Branch**: `main`
- **Auto-deploy**: Yes (on release tags)
- **Restrictions**: Requires approval, manual review

## Rollout Strategy: Blue-Green Deployment (Mobile Apps)

For mobile applications deployed via EAS, we use a controlled rollout strategy:

1. **Internal Testing**: Deploy to internal testers first
   - Use EAS development or preview builds
   - Duration: 1-2 days
   - Feedback collection

2. **Beta Testing**: Deploy to broader beta group
   - iOS: TestFlight closed group
   - Android: Closed testing track
   - Duration: 3-7 days
   - Stability monitoring

3. **Gradual Rollout**: Release to production gradually
   - Start at 5-10% of users
   - Monitor crash rate and error rate
   - If stable, increase to 25%
   - Then 50%, then 100%
   - Each step monitored for 24-48 hours

4. **Full Release**: All users get latest version
   - Crash rate stable
   - Error rates normal
   - User feedback positive
   - All metrics green

### Deployment Timeline
- **Staging/Beta**: 3-7 days (T+0 to T+7)
- **Gradual Rollout**: 2-3 days (T+7 to T+10)
- **Full Release**: T+10
- **Monitoring**: Continuous (24/7)

1. **Pre-deployment Checklist** (see release-checklist.md)
   - All tests passing
   - CI/CD pipeline green
   - Code review approved
   - Database migrations tested
   - Environment variables configured

2. **Stage 1: Build & Test** (Automated on push)
   - Build web application
   - Run test suite
   - Run linting
   - Build Docker image (if applicable)

3. **Stage 2: Deploy to Staging**
   - Deploy to Vercel preview environment
   - Run integration tests
   - Verify all features work
   - Check performance metrics

4. **Stage 3: User Acceptance Testing**
   - QA team tests in staging
   - Product team validates new features
   - Performance monitoring
   - Security review

5. **Stage 4: Deploy to Production**
   - Create release tag (v1.0.X)
   - Automatic deployment to Vercel production
   - Monitor error rates and performance
   - Stand by for rollback if needed

## Rollback Procedures

### Automated Rollback (< 5 minutes)
If critical issues are detected:

1. **Immediate Actions**
   - Vercel automatically routes to previous stable version
   - Monitor error rates in Sentry/logs
   - Alert team immediately

2. **Manual Rollback**
   ```bash
   # In Vercel dashboard:
   # 1. Go to Deployments
   # 2. Select previous stable version
   # 3. Click "Promote to Production"
   # 4. Verify rollback successful
   ```

### Partial Rollback (If only specific features affected)
1. Disable feature flags for affected features
2. Monitor metrics
3. Create hotfix branch from main
4. Deploy hotfix
5. Enable features once hotfix is deployed

### Full Rollback to Previous Version
1. Navigate to Vercel deployment history
2. Find last known good deployment
3. Click "Promote to Production"
4. Verify production metrics
5. Notify stakeholders
6. Post-mortem analysis

### Rollback Checklist
- [ ] Production error rate increased > 5%
- [ ] Critical features non-functional
- [ ] Database migrations failed
- [ ] Authentication/security issues
- [ ] Performance degraded > 50%
- [ ] API endpoints returning errors

**Rollback Time Target**: < 5 minutes from detection to previous stable version

## Environmental Variables

### Staging Environment
```
VITE_SUPABASE_URL=https://staging-supabase.supabase.co
VITE_SUPABASE_KEY=staging-key-here
VITE_API_URL=https://trovio-staging.vercel.app/api
VITE_FIREBASE_API_KEY=staging-firebase-key
```

### Production Environment
```
VITE_SUPABASE_URL=https://prod-supabase.supabase.co
VITE_SUPABASE_KEY=prod-key-here
VITE_API_URL=https://trovio.app/api
VITE_FIREBASE_API_KEY=prod-firebase-key
```

## Monitoring & Alerts

### Key Metrics
- Error rate (target: < 0.1%)
- Response time (target: < 2s)
- Uptime (target: 99.9%)
- User sessions
- API latency

### Alert Thresholds
- Error rate > 1%: Warning
- Error rate > 5%: Critical (Consider rollback)
- Response time > 5s: Warning
- Uptime < 99%: Critical

### Monitoring Tools
- Sentry: Error tracking
- Vercel Analytics: Performance metrics
- Datadog: Infrastructure monitoring
- LogRocket: Session replay

## Post-Deployment

1. Monitor for 24 hours
2. Collect user feedback
3. Performance validation
4. Incident response readiness
5. Document any issues
6. Plan improvements for next release

## Contacts & Escalation

| Role | Contact | Response Time |
|------|---------|---|
| On-Call Engineer | TBD | 15 minutes |
| Engineering Lead | TBD | 30 minutes |
| Product Manager | TBD | 1 hour |
