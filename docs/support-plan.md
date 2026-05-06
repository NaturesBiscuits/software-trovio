# Support Plan

## Overview
This document defines the support process, incident response procedures, and escalation path for the Trovio application.

## Support Channels

### Primary Support Channels
| Channel | Purpose | Response Time |
|---------|---------|---|
| Email: support@trovio.app | General inquiries and bug reports | 24 hours |
| In-app Help | FAQs and documentation links | N/A |
| GitHub Issues | Technical bugs and feature requests | 48 hours |
| Slack #support | Internal team coordination | 15 minutes |

### Emergency Contact
- **Critical Issues Only**: On-call engineer (phone/SMS)
- **Escalation**: Engineering Lead
- **Executive**: Product Manager

## Support SLA (Service Level Agreement)

### Response Times

| Priority | Severity | Response Time | Resolution Target |
|----------|----------|---|---|
| **Critical (P1)** | System down, data loss, security breach | 15 minutes | 1-4 hours |
| **High (P2)** | Major feature broken, significant degradation | 1 hour | 4-8 hours |
| **Medium (P3)** | Minor feature broken, workaround available | 4 hours | 1-2 days |
| **Low (P4)** | UI/UX issues, cosmetic problems | 24 hours | 1 week |

### Availability
- **24/7 Monitoring**: Error rate, uptime, critical alerts
- **Business Hours Support**: Mon-Fri 9 AM - 6 PM EST
- **After-Hours**: On-call engineer for critical issues only
- **Holidays**: Limited support, critical issues only

## Common Issues & Troubleshooting

### Authentication Issues

**Problem**: User cannot login
- [ ] Clear browser cache and cookies
- [ ] Verify email is correct
- [ ] Check if account is locked (too many login attempts)
- [ ] Reset password if forgot credentials
- [ ] Verify email is verified (check email inbox)

**Solution**: 
```
1. Go to login page
2. Click "Forgot Password?"
3. Enter email address
4. Click reset link in email
5. Set new password
6. Login with new password
```

**Escalation**: If issue persists after 30 minutes → Engineering team

---

### Performance Issues

**Problem**: App is slow or loading takes too long
- [ ] Check internet connection speed
- [ ] Clear browser cache
- [ ] Close other browser tabs
- [ ] Try different browser (Chrome, Firefox, Safari)
- [ ] Restart mobile app
- [ ] Clear app cache on mobile

**Diagnostics**:
- Open browser DevTools (F12)
- Go to Network tab
- Reload page
- Check if any requests are slow (red/yellow indicators)
- Check for console errors

**Escalation**: If still slow with good connection → Engineering team with DevTools screenshots

---

### Payment/Billing Issues

**Problem**: Payment failed or transaction stuck
- [ ] Verify payment method is valid
- [ ] Check if card is not expired
- [ ] Try different payment method
- [ ] Check email for error details
- [ ] Log out and back in

**Action**: Contact Stripe support if payment provider issue

**Escalation**: Billing team + Engineering if system issue

---

### Map/Location Features Not Working

**Problem**: Map not showing or location not detected
- [ ] Allow location permissions
- [ ] Verify GPS is enabled (mobile)
- [ ] Zoom in/out on map
- [ ] Try different map provider (Google Maps vs Apple Maps)
- [ ] Refresh the page

**Technical Check**:
- Browser console should not show geolocation errors
- Check browser permissions: Settings → Privacy → Location

**Escalation**: If location API broken → Engineering team

---

### Language/Localization Issues

**Problem**: Content not translating or showing wrong language
- [ ] Log out and back in
- [ ] Go to Settings → Language
- [ ] Select correct language
- [ ] Refresh page
- [ ] Clear browser cache

**Escalation**: If specific language content broken → i18n team

---

### Promotion Display Issues

**Problem**: Promotion not showing on store or data incorrect
- [ ] Verify promotion is activated
- [ ] Check promotion dates are correct
- [ ] Verify store location matches promotion area
- [ ] Log out and back in to refresh cache
- [ ] Clear image cache

**Admin Action**:
1. Go to Admin Panel
2. Check promotion status (Active/Inactive)
3. Verify dates and visibility settings
4. Clear store cache: `clear-cache` command

**Escalation**: If database issue → Engineering team

---

## Incident Response Procedure

### Step 1: Detection & Alerting (0-5 minutes)
- Sentry error monitoring alerts team
- Uptime monitoring alerts team
- User reports issue via email/chat
- **Action**: Page on-call engineer immediately

### Step 2: Initial Assessment (5-15 minutes)
- [ ] Verify issue is real (reproduce if possible)
- [ ] Check error logs and monitoring dashboards
- [ ] Identify scope (affecting all users? specific feature?)
- [ ] Classify priority level (P1-P4)
- [ ] Create incident in issue tracker

### Step 3: Communication (within 15 minutes)
- [ ] Notify engineering team on Slack
- [ ] Update status page (if public incident)
- [ ] Notify customers if P1/P2 (via email/SMS)
- [ ] Assign incident owner
- [ ] Create war room if P1/P2

### Step 4: Investigation (15-60 minutes)
- [ ] Gather logs from past 1-2 hours
- [ ] Check recent deployments
- [ ] Review database queries
- [ ] Check third-party API status
- [ ] Document findings in incident ticket

### Step 5: Mitigation (varies by issue)

**If deployment issue**: Consider rollback to previous version
**If database issue**: Execute data recovery procedures
**If API issue**: Switch to backup API endpoint or disable feature
**If traffic spike**: Enable rate limiting and scale infrastructure

### Step 6: Resolution & Verification
- [ ] Deploy fix or hotfix
- [ ] Verify in production
- [ ] Monitor error rates for 30 minutes
- [ ] Notify stakeholders resolution is complete
- [ ] Update incident status

### Step 7: Post-Incident (within 24 hours)
- [ ] Document root cause
- [ ] Schedule post-mortem meeting
- [ ] Create follow-up issues for prevention
- [ ] Update documentation/playbooks
- [ ] Notify all stakeholders of findings

## Escalation Path

```
User Report
    ↓
Support Team (tries troubleshooting)
    ↓
Cannot resolve in 30 min?
    ↓
Escalate to Engineering Team
    ↓
Cannot resolve in 2 hours?
    ↓
Escalate to Engineering Lead
    ↓
Critical Business Impact?
    ↓
Escalate to Product Manager
    ↓
Infrastructure/Provider Issue?
    ↓
Contact Third-Party (Vercel, Supabase, Firebase, etc.)
```

## Contact Information

### Internal Team
| Role | Name | Email | Phone |
|------|------|-------|-------|
| Engineering Lead | TBD | TBD | TBD |
| On-Call Engineer | TBD | TBD | TBD |
| Product Manager | TBD | TBD | TBD |
| Support Manager | TBD | TBD | TBD |

### External Contacts
| Service | Contact | Status Page |
|---------|---------|---|
| Vercel Hosting | support@vercel.com | vercel.com/status |
| Supabase (Database) | support@supabase.io | status.supabase.com |
| Firebase | firebase-support@google.com | firebase.google.com/status |
| Stripe (Payments) | support@stripe.com | status.stripe.com |

## Monitoring & Alerting

### Tools
- **Sentry**: Error tracking and alerting
- **Vercel Analytics**: Performance and deployment monitoring
- **Uptime Robot**: 24/7 availability monitoring
- **LogRocket**: Session replay and diagnostics
- **DataDog**: Infrastructure and APM monitoring

### Critical Metrics Being Monitored
- Error rate (target: < 0.1%)
- API latency (target: < 1000ms)
- Database query time (target: < 500ms)
- Uptime (target: 99.9%)
- Page load time (target: < 2 seconds)

### Alert Triggers
| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 1% | Alert engineering |
| Error Rate | > 5% | Page on-call + consider rollback |
| Uptime | < 99% | Alert engineering |
| API Latency | > 5s | Investigate + scale if needed |
| 404 Errors | Spike > 100% | Investigate deployment |

## Maintenance Windows

### Planned Maintenance
- **Frequency**: 1st Sunday of month
- **Time**: 2 AM - 4 AM EST (Low traffic window)
- **Expected Downtime**: 30 minutes
- **Communication**: 72-hour notice via email

### Database Maintenance
- **Frequency**: Quarterly
- **Backup Window**: Automatic daily at 2 AM EST
- **Retention**: 30-day backup retention

### Security Patches
- **Frequency**: As needed
- **Priority**: P1 security issues fixed within 24 hours
- **Process**: Deploy to staging first, then production

## Feedback & Continuous Improvement

### Monthly Review
- [ ] Review all support tickets
- [ ] Identify recurring issues
- [ ] Calculate MTTR (Mean Time To Resolution)
- [ ] Review SLA compliance
- [ ] Plan improvements

### Quarterly Goals
- Reduce response time by 10%
- Improve first-contact resolution rate
- Reduce critical incidents by 20%
- Improve documentation quality

## Support Documentation

### User-Facing Documentation
- [FAQ Page](../README.md)
- [Getting Started Guide](../docs/LANGUAGE_SYSTEM.md)
- [Troubleshooting Guide](./defect-log.md)

### Internal Documentation
- [Deployment Plan](./deployment-plan.md)
- [Release Checklist](./release-checklist.md)
- [Runbooks](./scm-notes.md)

---

**Last Updated**: May 2026
**Next Review**: August 2026
