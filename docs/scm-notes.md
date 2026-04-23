# SCM Notes - Merge Conflict Resolution

**Document Date:** April 23, 2026  
**Workshop:** Software Configuration Management (Git Mastery)  
**Project:** Trovio

---

## Overview

This document details the merge conflict resolution process conducted during the Git mastery workshop, demonstrating practical SCM best practices and conflict handling strategies.

### Additional Week 5 Exercise
- Feature branch: `feature/branch-naming-rules`
- Simulation branch: `bugfix/conflict-sim`
- Conflict file: `docs/scm-notes.md` (same line edited on both branches)
- Resolution: manually merged both branch intents into one final statement and completed merge commit.

---

## Scenario Summary

### Objective
Demonstrate professional merge conflict resolution in a collaborative development environment.

### Setup
- **Feature Branch:** `feature/enhance-qa-tooling`
- **Target Branch:** `dev`
- **Conflict Type:** Content conflict in `package.json`

---

## Step-by-Step Conflict Resolution

### 1. Initial Setup

**Created Feature Branch:**
```bash
git checkout -b feature/enhance-qa-tooling
```

**Feature Branch Commits:**
```
1b14eaa docs: add comprehensive contribution guidelines
456a7f9 feat: add CI/CD workflow for automated testing and code quality checks
5903680 chore: add CODEOWNERS file for code ownership guidelines
e0dbec6 chore: add test command scripts for automation
```

### 2. Divergent Development

**Branch 1: `dev` Branch Changes**
- Added `test:ci` script to `package.json`
- Purpose: Configure Jest for CI/CD environments
- Script Command: `jest --coverage --ci --reporters=default --reporters=json`
- Commit Message: `chore: add CI test script configuration`

```json
"test:ci": "jest --coverage --ci --reporters=default --reporters=json"
```

**Branch 2: `feature/enhance-qa-tooling` Branch Changes**
- Added `test:automated` script to `package.json`  
- Purpose: Configure Jest for rapid local testing with bail-fast strategy
- Script Command: `jest --bail --silent`
- Commit Message: `chore: add test command scripts for automation`

```json
"test:automated": "jest --bail --silent"
```

### 3. Merge Attempt

**Command:**
```bash
git checkout dev
git merge feature/enhance-qa-tooling
```

**Result:**
```
Auto-merging package.json
CONFLICT (content): Merge conflict in package.json
Automatic merge failed; fix conflicts and then commit the result.
```

### 4. Conflict Analysis

**Conflict Location:** `package.json` lines 12-18 (scripts section)

**Conflicted Content:**
```json
    "test:coverage": "jest --coverage",
<<<<<<< HEAD
    "test:ci": "jest --coverage --ci --reporters=default --reporters=json"
=======
    "test:automated": "jest --bail --silent"
>>>>>>> feature/enhance-qa-tooling
```

**Why This Conflict Occurred:**
- Both branches modified the same section (scripts) of `package.json`
- Git cannot determine which version to keep automatically
- Different features were added to the same logical block
- Manual resolution was required

### 5. Conflict Resolution Strategy

**Decision:** Keep BOTH scripts
- **Rationale:** Both test strategies provide value:
  - `test:ci`: For automated testing in continuous integration
  - `test:automated`: For rapid feedback during development
- **Resolution Approach:** Merge content rather than overwrite

### 6. Manual Resolution

**Resolved Content:**
```json
"scripts": {
  "start": "expo start",
  "reset-project": "node ./scripts/reset-project.js",
  "android": "expo run:android",
  "ios": "expo run:ios",
  "web": "expo start --web",
  "lint": "expo lint",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:ci": "jest --coverage --ci --reporters=default --reporters=json",
  "test:automated": "jest --bail --silent"
}
```

**Steps Taken:**
1. Removed conflict markers (`<<<<<<`, `======`, `>>>>>>`)
2. Preserved both test scripts
3. Maintained JSON syntax validity
4. Kept logical ordering (basic commands first, specialized second)

### 7. Merge Completion

**Command:**
```bash
git add package.json
git commit -m "Merge branch 'feature/enhance-qa-tooling' into dev

Resolved merge conflict in package.json by combining both:
- test:ci script for automated CI/CD testing  
- test:automated script for bail-fast testing

Both test strategies are now available for different use cases."
```

**Result:**
```
[dev b66839b] Merge branch 'feature/enhance-qa-tooling' into dev
```

---

## Lessons Learned

### Best Practices Applied

1. **Clear Branch Naming**
   - ✅ Used `feature/enhance-qa-tooling` convention
   - ✅ Descriptive name indicates purpose
   - ✅ Followed organization standards

2. **Meaningful Commits**
   - ✅ Each commit had clear, single responsibility
   - ✅ Detailed commit messages explained changes
   - ✅ Conventional Commits format used

3. **Conflict Resolution**
   - ✅ Analyzed both versions before deciding
   - ✅ Made logical decision to keep both scripts
   - ✅ Tested JSON syntax validity after resolution
   - ✅ Clear merge commit message explaining decision

4. **Communication**
   - ✅ Documented the conflict scenario
   - ✅ Explained resolution rationale
   - ✅ Made intent clear in commit message

### Common Merge Conflict Patterns

| Pattern | Cause | Solution |
|---------|-------|----------|
| Adjacent Lines | Different features modifying same area | Keep both, test for compatibility |
| Same Lines | Truly conflicting changes | Team discussion needed |
| Whitespace | Line ending differences | Configure `.gitattributes` |
| Dependencies | Version conflicts | Resolve together with team |

### When to Ask for Help

❌ **Don't resolve alone if:**
- You don't understand both changes
- Conflict affects critical functionality
- Non-obvious best resolution exists
- Team needs to decide on direction

✅ **Do resolve if:**
- Both changes are compatible
- You understand purpose of both changes
- Logical merge strategy exists
- Team has delegated responsibility to you

---

## Conflict Prevention Strategies

### 1. Communication
- Discuss large changes in advance
- Announce long-running feature branches
- Keep branches short-lived (< 3 days ideal)

### 2. Small, Focused Commits
```bash
# Good - specific change
git commit -m "feat: add test:ci script"

# Bad - multiple unrelated changes
git commit -m "update dependencies and add tests and fix UI"
```

### 3. Frequent Rebasing
```bash
# Keep feature branch up to date with dev
git fetch origin
git rebase origin/dev
```

### 4. Code Organization
- Keep different concerns in separate files
- Avoid modifying shared configuration files simultaneously
- Use feature flags instead of large refactors

### 5. Pre-Merge Coordination
- Review in-progress changes early
- Discuss architectural decisions before implementation
- Pair program on high-conflict areas

---

## Tools and Commands

### Detecting Conflicts
```bash
# See conflict status
git status

# View detailed conflict info
git diff HEAD
```

### Resolving Conflicts
```bash
# Manual resolution (edit file)
# Then:
git add <conflicted-file>

# Or use merge tool
git mergetool

# Complete merge
git commit
```

### Undoing a Bad Merge
```bash
# Before committing merge
git merge --abort

# After committing merge
git revert -m 1 <merge-commit>
```

---

## Merge Conflict Statistics

**This Exercise:**
- **Total Files Changed:** 5
- **Conflicted Files:** 1
- **Total Conflicts:** 1
- **Resolution Time:** ~5 minutes
- **Strategy:** Combine both versions
- **Outcome:** ✅ Successful merge

---

## Version Control Best Practices Demonstrated

✅ Feature branches created from development branch  
✅ Clear commit messages with conventional format  
✅ Logical separation of concerns per commit  
✅ Merge conflict resolved with clear rationale  
✅ Merge commit documented decision made  
✅ Both feature contributions preserved  

---

## Conclusion

This exercise demonstrated professional merge conflict resolution following industry best practices. The key takeaway is that merge conflicts are normal and manageable with clear communication, logical decision-making, and proper documentation.

### Key Takeaways

1. **Merge conflicts are normal** - They indicate parallel development
2. **Clear strategy wins** - Know why you're keeping each version
3. **Communication matters** - Document decisions in commit messages
4. **Both can be right** - Test compatibility before rejecting either version
5. **Prevention > Resolution** - Small commits and good communication reduce conflicts

---

## Related Documents

- [Contribution Guidelines](../CONTRIBUTING.md)
- [QA Plan](./qa-plan.md)
- [Git Workflow](./git-workflow.md)
- [Release Notes](./release-notes.md)

---

## Appendix: Git Conflict Markers Explained

```
<<<<<<< HEAD                    # Start of conflict (your current branch)
    "test:ci": "..."           # Your version (dev branch)
=======                        # Separator
    "test:automated": "..."    # Incoming version (feature branch)
>>>>>>> feature/enhance-qa-tooling  # End of conflict
```

**Remember:** Always remove the conflict markers during resolution!
