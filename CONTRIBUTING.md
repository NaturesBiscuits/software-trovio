# Contributing to Trovio

Thank you for your interest in contributing to Trovio! This guide will help you understand our development process, code standards, and workflow.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Branch Naming Convention](#branch-naming-convention)
4. [Commit Message Guidelines](#commit-message-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Testing Requirements](#testing-requirements)
7. [Code Review Process](#code-review-process)
8. [Reporting Issues](#reporting-issues)

---

## Code of Conduct

Be respectful, inclusive, and professional. We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/).

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+
- Git
- Expo CLI (for mobile testing)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/NaturesBiscuits/software-trovio.git
cd software-trovio

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Run linter
npm run lint
```

---

## Branch Naming Convention

We follow a strict branch naming convention to keep the repository organized:

### Feature Branches
```
feature/<feature-name>
```
Examples:
- `feature/add-user-authentication`
- `feature/enhance-discover-page`
- `feature/implement-push-notifications`

### Bug Fix Branches
```
bugfix/<bug-name>
```
Examples:
- `bugfix/fix-image-upload-error`
- `bugfix/resolve-location-permission-crash`
- `bugfix/correct-promotion-calculation`

### Hotfix Branches (Production Only)
```
hotfix/<issue-name>
```
Examples:
- `hotfix/critical-payment-bug`
- `hotfix/security-vulnerability-patch`

### Release Branches
```
release/<version-number>
```
Examples:
- `release/v0.5.0`
- `release/v1.0.0`

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- **feat:** A new feature
- **fix:** A bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, semicolons, etc.)
- **refactor:** Code refactoring without changing functionality
- **perf:** Performance improvements
- **test:** Adding or updating tests
- **chore:** Dependency updates, tool config, etc.
- **ci:** CI/CD configuration changes

### Scope (Optional)
The scope specifies what part of the codebase is affected:
- auth
- ui
- api
- database
- notification
- analytics
- localization
- etc.

### Subject
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period (.) at the end
- Limit to 50 characters
- Be specific and descriptive

### Body (Optional)
- Explain what and why, not how
- Wrap at 72 characters
- Separate from subject with a blank line

### Footer (Optional)
Reference issues and breaking changes:
```
Closes #123
Breaks: Old API removed
```

### Examples

**Simple fix:**
```
fix(auth): resolve invalid refresh token error
```

**Feature with details:**
```
feat(notifications): add push notification support

- Implement Firebase Cloud Messaging integration
- Add notification preferences to user settings
- Create notification center screen
- Include sound and badge count options

Closes #456
```

**Breaking change:**
```
feat(api): redesign authentication flow

BREAKING CHANGE: Old login endpoint deprecated, use /auth/v2/login instead
```

---

## Pull Request Process

### Before Creating a PR
1. Create a feature/bugfix/hotfix branch from `dev` (or `main` for hotfixes)
2. Make your changes
3. Write/update tests for your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint`
6. Commit with clear messages
7. Push to your fork or branch

### Creating a PR
1. Go to GitHub and create a pull request
2. Use the PR template (if available)
3. Fill in the title clearly: `[type] Short description`
4. Reference related issues: `Closes #123`
5. Describe what changed and why
6. List any breaking changes

### PR Checklist
- [ ] Branch follows naming convention (`feature/`, `bugfix/`, etc.)
- [ ] Commits have clear, descriptive messages
- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] Code coverage not decreased
- [ ] Documentation updated if needed
- [ ] CHANGELOG updated
- [ ] No merge conflicts with target branch

### PR Title Format
```
[TYPE] Brief description

[FEATURE] Add user profile customization
[BUGFIX] Fix image upload timeout error
[HOTFIX] Resolve payment processing crash
```

---

## Testing Requirements

### Unit Tests
- Write tests for all new functions and components
- Aim for 80%+ coverage on new code
- Run: `npm test`

### Testing Commands
```bash
npm test              # Run all tests once
npm run test:watch   # Watch mode for development
npm run test:coverage # Generate coverage report
```

### Test File Naming
- `<component>.test.ts` for unit tests
- `<component>.integration.test.ts` for integration tests

### Example Test Structure
```typescript
describe('Component Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

---

## Code Review Process

### What Reviewers Look For
1. **Code Quality:** Clean, readable, well-structured code
2. **Test Coverage:** Sufficient tests for the changes
3. **Performance:** No regressions or optimizations needed
4. **Security:** No vulnerabilities or unsafe patterns
5. **Documentation:** Comments and docs are clear
6. **Consistency:** Follows project conventions

### Review Expectations
- Reviews typically happen within 24-48 hours
- Authors should respond to feedback promptly
- Multiple iterations are normal and expected
- Be respectful and constructive in comments

### Resolving Feedback
1. Address all requested changes
2. Ask for clarification if needed
3. Push additional commits (don't force-push during review)
4. Mark conversations as resolved
5. Request re-review when ready

---

## Reporting Issues

### How to Report a Bug
1. Check if the issue already exists
2. Use a clear, descriptive title
3. Describe steps to reproduce
4. Explain expected vs actual behavior
5. Include screenshots/logs if relevant
6. Specify your environment (OS, device, version)

### Issue Template
```markdown
## Description
[Brief description of the issue]

## Steps to Reproduce
1. ...
2. ...
3. ...

## Expected Result
[What should happen]

## Actual Result
[What actually happens]

## Environment
- OS: [iOS/Android/Web]
- Device: [e.g., iPhone 14, Samsung S23]
- App Version: [e.g., 0.5.0]
- Browser: [if applicable]

## Screenshots
[Attach screenshots or videos]
```

---

## Development Workflow Example

```bash
# 1. Create feature branch from dev
git checkout -b feature/add-store-reviews

# 2. Make changes and test
npm test

# 3. Commit changes
git commit -m "feat(store): add review system for listings"

# 4. Push to GitHub
git push origin feature/add-store-reviews

# 5. Create pull request on GitHub

# 6. Respond to reviews and push updates
git commit -m "review: address feedback on review UI"
git push origin feature/add-store-reviews

# 7. Merge PR (done via GitHub)

# 8. Delete local branch
git branch -d feature/add-store-reviews
```

---

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [JavaScript/TypeScript Style Guide](https://airbnb.io/javascript/)
- [Jest Testing Documentation](https://jestjs.io/)
- [React Best Practices](https://react.dev/learn)

---

## Questions?

- Open an issue for discussions
- Join our Slack/Discord (if applicable)
- Contact the maintainers

Thank you for contributing to Trovio! 🎉
