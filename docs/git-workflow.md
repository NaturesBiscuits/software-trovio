# Git Workflow Rules

All Trovio changes must go through pull requests before being merged into `dev` or `main`.

## Branch Naming Rules

Working branches must use one of these formats:

- `feature/<name>` for new features
- `bugfix/<name>` for bug fixes
- `hotfix/<name>` for urgent production fixes

Use lowercase words separated by hyphens, dots, or underscores after the slash. Examples:

- `feature/branch-naming-rules`
- `bugfix/login-validation`
- `hotfix/payment-timeout`

The `.github/workflows/branch-name-check.yml` workflow validates these rules on pull requests and branch pushes.

## Required Pull Request Steps

- Create a feature branch for each change.
- Open a pull request into `dev` for normal work or `main` for releases.
- Complete the pull request template with summary, screenshots, testing evidence, and linked issue.
- Review the diff before merge.
- Merge only after the PR is complete and any review feedback is addressed.
