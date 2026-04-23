# QA Plan - Trovio

## Document Overview
This Quality Assurance Plan defines the testing strategy, severity levels, and defect management processes for the Trovio application.

**Last Updated:** April 23, 2026  
**Owner:** QA Team  
**Status:** Active

---

## 1. Testing Strategy & Levels

### 1.1 Unit Testing
- **Definition:** Tests individual functions, components, and utilities in isolation
- **Scope:** Component rendering, utility functions, hooks, business logic
- **Tools:** Jest, React Testing Library
- **Target Coverage:** 60%+ of critical components
- **Execution:** Automated, runs on every commit

**Components to Test:**
- Utility functions (`utils/cn.ts`, `lib/authUtils.ts`, etc.)
- Custom hooks (`hooks/use-color-scheme.ts`, etc.)
- UI Components (`components/ui/Button.tsx`, `components/ui/Input.tsx`, etc.)
- Context providers (`context/AuthContext.tsx`, etc.)

### 1.2 Integration Testing
- **Definition:** Tests interactions between multiple components and modules
- **Scope:** Feature workflows, API calls, state management
- **Tools:** Jest + React Testing Library
- **Target Coverage:** Key user flows (login, create promotion, view store)
- **Execution:** Automated, runs before PR merge

**Workflows to Test:**
- User authentication flow (signup → login)
- Store listing creation and publication
- Promotion creation and management

### 1.3 System Testing
- **Definition:** End-to-end testing of complete features across the app
- **Scope:** Full user journeys on physical devices or emulators
- **Tools:** Detox (E2E testing), manual QA
- **Execution:** Manual testing cycles before releases

**Key Scenarios:**
- Complete user onboarding
- Store discovery and exploration
- Store promotion booking
- Account management and deletion

---

## 2. Entry & Exit Criteria

### 2.1 Entry Criteria (Sprint Start)

Development work on a feature begins only when:
- [ ] Requirements are clearly defined and documented
- [ ] Technical design is reviewed and approved
- [ ] Test cases are identified and test data is prepared
- [ ] Dependencies and blockers are resolved
- [ ] Environment is ready (staging, test databases)

### 2.2 Exit Criteria (Sprint End)

A feature is considered ready for release when:
- [ ] All unit tests pass (100% of written tests)
- [ ] Code coverage is ≥60% for new code
- [ ] All integration tests pass
- [ ] Code review completed with approval
- [ ] No critical (S1) or high (S2) defects remain open
- [ ] Performance benchmarks met (load time <3s)
- [ ] Documentation updated
- [ ] Manual QA approved on staging environment

### 2.3 Release Criteria

Code is approved for production release when:
- [ ] All exit criteria met for the sprint
- [ ] System testing completed without critical issues
- [ ] Regression testing passed
- [ ] Stakeholder approval obtained
- [ ] Rollback plan documented

---

## 3. Severity Levels

Defects are classified by severity to prioritize fixes and releases:

### **S1 - CRITICAL**
**Impact:** Complete product unavailability or data loss  
**Examples:**
- App crashes on startup
- Authentication completely broken (no users can login)
- Complete loss of user data
- Security vulnerability exposing sensitive data
- Payment processing failure

**Response Time:** 1 hour  
**Fix Deadline:** Same day  
**Release:** Immediate hotfix required

---

### **S2 - HIGH**
**Impact:** Major feature is unusable or significantly degraded  
**Examples:**
- Core feature unavailable (can't create store/promotion)
- Performance issue: load time >10 seconds
- Data corrupted but recovery possible
- Security issue with workaround available
- Incorrect calculation affecting multiple users

**Response Time:** 4 hours  
**Fix Deadline:** Next business day  
**Release:** Include in next release or hotfix if critical enough

---

### **S3 - MEDIUM**
**Impact:** Feature works but with noticeable issues  
**Examples:**
- Minor UI bug (spacing, alignment, color)
- Non-critical feature partially broken
- Error message unclear but functionality works
- Performance issue: load time 3-10 seconds
- Cosmetic issues on specific screen sizes

**Response Time:** 24 hours  
**Fix Deadline:** Within 1-2 sprints  
**Release:** Include in next planned release

---

### **S4 - LOW**
**Impact:** Cosmetic or edge case issues  
**Examples:**
- Typos in UI text
- Minor visual inconsistencies
- Edge case behavior (rare user actions)
- Documentation inaccuracies
- Nice-to-have improvements

**Response Time:** 48 hours  
**Fix Deadline:** No fixed deadline (backlog item)  
**Release:** Include when convenient, may not be fixed

---

## 4. Defect Management Process

### 4.1 Defect Lifecycle

```
New → Assigned → In Progress → Fixed → Testing → Closed
  ↓                                    ↓
  Duplicate/Invalid                    Rejected
```

### 4.2 Defect Report Template

```
Title: [Component] - Brief description
Severity: S1 | S2 | S3 | S4
Status: New | Assigned | In Progress | Fixed | Testing | Closed
Steps to Reproduce:
1. ...
2. ...
Expected Result: ...
Actual Result: ...
Environment: iOS/Android, version
Attachments: Screenshots/logs if applicable
```

### 4.3 Bug Triage

- **Weekly Triage Meeting:** Review all new defects
- **Assignment:** Assign to appropriate team member based on severity and expertise
- **Estimation:** Estimate fix effort and schedule

---

## 5. Testing Environment

### 5.1 Local Development
- Node.js v18+
- npm or yarn
- Jest for unit testing
- React Testing Library
- Expo CLI

### 5.2 Staging Environment
- Simulates production with test data
- Used for integration and system testing
- Accessible to QA and development team

### 5.3 Production Environment
- Live application with real users
- Only after all criteria met
- Production monitoring and alerting enabled

---

## 6. Responsibilities

| Role | Responsibility |
|------|-----------------|
| **Developer** | Write unit tests, fix assigned bugs, perform code review |
| **QA Lead** | Create test plans, manage defect log, report metrics |
| **Product Owner** | Prioritize defects, approve releases |
| **DevOps** | Manage test environments, CI/CD pipeline |

---

## 7. Testing Schedule

| Activity | Frequency | Duration |
|----------|-----------|----------|
| Unit Testing | On every commit | Automated (~5 min) |
| Integration Testing | Before PR merge | Manual review + automated |
| Sprint QA | End of sprint | 2-3 days |
| Regression Testing | Before release | 1 day |
| Performance Testing | Monthly | 1 day |

---

## 8. Success Metrics

- **Test Coverage:** ≥60% of critical code paths
- **Defect Detection:** >80% of defects found before production
- **Fix Rate:** ≥95% of S1/S2 fixed within deadline
- **Test Pass Rate:** ≥95% of tests passing in CI/CD
- **Mean Time to Fix:** S1 <4 hours, S2 <24 hours
- **User Reported Bugs:** <2 per release

---

## 9. Test Automation Goals

### Phase 1 (Sprint 1-2): Foundation
- [ ] Jest setup and configuration
- [ ] 5-10 unit tests for core utilities
- [ ] Basic CI/CD integration
- [ ] Test reporting

### Phase 2 (Sprint 3-4): Coverage Expansion
- [ ] 20+ unit tests across components
- [ ] Integration tests for auth flow
- [ ] Component snapshot tests
- [ ] Coverage reporting (60%+ target)

### Phase 3 (Sprint 5+): Advanced Testing
- [ ] E2E tests with Detox
- [ ] Performance benchmarks
- [ ] Visual regression testing
- [ ] Load testing

---

## 10. Approval & Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Tech Lead | | | |
| Product Owner | | | |

---

## Appendices

### A. Test Data Requirements
- Test user accounts with different roles
- Sample stores and promotions
- Edge case scenarios (empty lists, max length fields)

### B. Test Tools Installation
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @types/jest jest-environment-jsdom
```

### C. References
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Risk Register](./risk-register.md)
