# Technical Debt

## Current Items

1. `utils/styleUtils.ts` duplicated the same spacing style construction logic for padding and margin, increasing maintenance work when spacing behavior changes.
2. `lib/imageUtils.ts` repeats temporary-file cleanup logic in multiple upload paths, which makes error handling harder to keep consistent.
3. `lib/imageUtils.ts` mixes compression, file reading, upload, fallback upload, and cleanup in one large function, making it difficult to test individual failure paths.
4. Several components still use direct inline style objects instead of shared design-system primitives, which can drift from the token system over time.
5. Deployment documentation is spread across several files with overlapping names, which increases the chance that instructions become inconsistent.

## Selected Refactor

Selected item 1: consolidate the duplicated padding and margin logic in `utils/styleUtils.ts`.

The refactor introduced a shared internal `createSpacingStyle` helper used by both `padding` and `margin`. This keeps the public API unchanged while reducing duplicate branching and making future spacing-axis changes local to one function.
