# Release Notes - v0.5-scm

**Version:** v0.5-scm  
**Release date:** April 23, 2026  
**Release type:** Software configuration management lab release

## Summary

This release documents the Week 5 SCM workflow for Trovio. It records branch naming rules, pull request usage, merge conflict resolution, release notes, and release tagging evidence.

## Added

- Branch naming validation through `.github/workflows/branch-name-check.yml`.
- Required working branch formats:
  - `feature/<name>`
  - `bugfix/<name>`
  - `hotfix/<name>`
- CODEOWNERS coverage through `.github/CODEOWNERS`.
- One user-facing feature on the landing page: selected language summary text.
- Merge conflict documentation in `docs/scm-notes.md`.

## SCM Evidence

- Feature branch: `feature/branch-naming-rules`
- Target branch: `dev`
- Merge commit: `466a54f` (`merge: integrate feature branch into dev with conflict resolution`)
- Conflict simulation branches: `feature/branch-naming-rules` and `bugfix/conflict-sim`
- Conflict documentation: `docs/scm-notes.md`
- Release tag: `v0.5-scm`

## Validation

- Branch naming workflow accepts `feature/<name>`, `bugfix/<name>`, and `hotfix/<name>`.
- The conflict was resolved by preserving both branch intents and documenting the final decision.
- Release notes were created for the `v0.5-scm` release.

## Notes

- GitHub CLI is not installed in this local environment, so GitHub PR evidence should be verified through the repository UI if needed.
- The local tag `v0.5-scm` exists in this checkout.
