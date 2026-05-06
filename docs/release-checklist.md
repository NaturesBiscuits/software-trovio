# Release Checklist

Use this checklist before deploying any version to production or staging environments.

## Pre-Release Testing (1-2 hours)

### Code Quality & Testing
- [ ] All unit tests passing: `npm run test`
- [ ] All integration tests passing: `npm run test:ci`
- [ ] Code coverage maintained or improved (minimum 70%)
- [ ] Linting passes: `npm run lint`
- [ ] No security vulnerabilities in dependencies: `npm audit`
- [ ] TypeScript compilation succeeds: `tsc --noEmit`

### CI/CD Pipeline
- [ ] GitHub Actions workflow passes
- [ ] Build succeeds without warnings
- [ ] All status checks green
- [ ] Branch protection rules satisfied
- [ ] Code review approval received (minimum 1 reviewer)

### Functional Testing
- [ ] Smoke tests on web build
- [ ] Mobile app builds successfully (iOS/Android)
- [ ] Key user workflows tested manually:
  - [ ] User registration and login
  - [ ] Creating a promotion
  - [ ] Viewing promotions on store
  - [ ] Payment processing (if applicable)
  - [ ] Language switching functionality
  - [ ] Map features and location services

### Performance & Accessibility
- [ ] Lighthouse score ≥ 80
- [ ] No accessibility violations (WCAG AA)
- [ ] Bundle size acceptable (< 500KB web app)
- [ ] No console errors or warnings
- [ ] Images optimized and cached properly
- [ ] API response times acceptable (< 2 seconds)

### Database
- [ ] All database migrations tested locally
- [ ] Migration rollback procedure verified
- [ ] Database backup created
- [ ] Schema changes documented
- [ ] Seed data updated if needed

## Pre-Release Documentation (30 minutes)

### Release Notes
- [ ] Changelog updated with new features
- [ ] Known issues documented
- [ ] Breaking changes clearly noted
- [ ] Migration guide created (if needed)
- [ ] Screenshots/GIFs added for UI changes

### Deployment Documentation
- [ ] Deployment plan reviewed (deployment-plan.md)
- [ ] Environment variables documented
- [ ] Rollback procedure reviewed
- [ ] Support escalation updated (support-plan.md)

## Environment Setup (30 minutes)

### Staging Environment
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Third-party API keys valid (Supabase, Firebase, etc.)
- [ ] CDN cache cleared
- [ ] SSL certificate valid

### Monitoring & Alerting
- [ ] Sentry configured and connected
- [ ] Error tracking enabled
- [ ] Alerts configured for staging
- [ ] Log aggregation working
- [ ] Dashboard created for monitoring

## Release Preparation (15 minutes)

### Version Management
- [ ] Version number updated in:
  - [ ] package.json
  - [ ] app.config.ts
  - [ ] docs/release-notes.md
  - [ ] CHANGELOG.md (if exists)
- [ ] Version bump follows semantic versioning
- [ ] Git tag prepared: `v1.0.X`

### Backup & Recovery
- [ ] Current production database backed up
- [ ] Previous version committed and tagged
- [ ] Rollback plan documented and tested
- [ ] Team notified of deployment window

### Communication
- [ ] Deployment scheduled outside business hours (if possible)
- [ ] Team notified (Slack/Email)
- [ ] Support team briefed on changes
- [ ] Customer communication prepared

## Go/No-Go Decision (before deployment)

| Criteria | Status | Sign-off |
|----------|--------|----------|
| All tests passing | ☐ | |
| CI pipeline green | ☐ | |
| Code review approved | ☐ | |
| Staging deployment successful | ☐ | |
| QA sign-off | ☐ | |
| Product owner approval | ☐ | |
| Support team ready | ☐ | |
| Monitoring configured | ☐ | |
| Rollback plan ready | ☐ | |

**Go Decision**: ☐ YES / ☐ NO

**Decision Made By**: ___________________

**Date & Time**: ___________________

## Deployment Execution (varies)

### During Deployment
- [ ] Changes deployed to staging first
- [ ] Staging environment validated
- [ ] Changes promoted to production
- [ ] Production deployment verified
- [ ] Health checks passing
- [ ] Error rates normal
- [ ] Performance metrics acceptable

### Post-Deployment Monitoring (24 hours)
- [ ] Error rate monitored and normal
- [ ] Performance metrics within acceptable range
- [ ] User-reported issues tracked
- [ ] Database queries performing well
- [ ] No unexpected logs or warnings
- [ ] Feature flags working correctly
- [ ] Customer-facing dashboards updated

## Post-Release (within 1 week)

### Validation
- [ ] Release notes published
- [ ] Documentation updated
- [ ] Analytics tracking new features
- [ ] User feedback collected
- [ ] Performance metrics reviewed
- [ ] Security scan completed

### Documentation
- [ ] Deployment documented in wiki/docs
- [ ] Incident reports filed (if any issues)
- [ ] Post-mortem scheduled (if needed)
- [ ] Lessons learned captured

### Cleanup
- [ ] Feature flags cleaned up
- [ ] Staging environment reset
- [ ] Old logs archived
- [ ] Database migrations cleanup (if needed)

## Rollback Activation (if needed)

- [ ] Issue identified and verified
- [ ] Rollback decision approved by engineering lead
- [ ] Previous version identified and ready
- [ ] Database rollback plan (if migrations deployed)
- [ ] Team notified
- [ ] Rollback executed
- [ ] Production verified on previous version
- [ ] Root cause analysis started

---

## Notes Section

Use this section to document any issues encountered during the release:

**Pre-Release Issues**:

**Deployment Issues**:

**Post-Release Issues**:

**Lessons Learned**:
