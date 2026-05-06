# Performance Notes

## Refactor Measured

Refactored `utils/styleUtils.ts` by replacing duplicated padding and margin construction logic with a shared internal helper.

## Measurement Method

Command used before and after:

```powershell
Measure-Command { npm.cmd test -- __tests__/styleUtils.test.ts --runInBand }
```

This measures the focused style utility test suite as a simple proxy for whether the refactor changed utility behavior or introduced noticeable test/runtime overhead.

## Results

| Run | Result | Jest reported time | PowerShell wall time |
| --- | --- | ---: | ---: |
| Before refactor | 17 tests passed | 2.812 s | 7.610 s |
| After refactor | 17 tests passed | 4.835 s | 7.890 s |

## Observation

The refactor did not target user-visible load time or memory usage. The after run stayed within the same wall-clock range as the before run, with the small difference likely dominated by Jest startup and local machine noise. The maintainability improvement is the main benefit: spacing-axis behavior now lives in one helper instead of two duplicated functions.
