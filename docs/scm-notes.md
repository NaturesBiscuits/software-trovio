# SCM Practice Notes

## Merge Conflict Simulation and Resolution

Date: 2026-04-23

### Scenario
- A deliberate conflict was created between `feature/branch-naming-rules` and `bugfix/conflict-sim` by editing the same line differently on each branch.
- The branches were merged locally to trigger a conflict for practice.

### Conflict Resolution Steps
1. Checked conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) in `docs/scm-notes.md`.
2. Reviewed both versions and combined useful details from each branch.
3. Removed markers and kept a single coherent final section.
4. Added and committed the resolved file.

### What Happened
- Git could not automatically decide which branch content to keep in the same lines.
- Manual editing was required to preserve both context and final notes.
- After staging and committing the resolved file, merge completed successfully.
