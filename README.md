# mejora

Prevent regressions by allowing only improvement.

`mejora` runs checks, compares their results to a stored baseline, and fails only when things get worse.

If results improve or stay the same, the run passes.

## What problem it solves

Most tools ask: _“Is this perfect?”_
`mejora` asks: _“Did this regress?”_

This makes it practical for:

- large or legacy codebases
- incremental cleanup
- CI enforcement without blocking progress

## How it works

1. Each check produces a snapshot, a list of items
2. The snapshot is compared to a baseline
3. New items cause failure
4. Removed items are treated as improvement

Baselines are explicit and should be committed to the repo.

## Installation

```bash
pnpm add -D mejora
```

> [!NOTE]
> `mejora` requires Node.js 22.18.0 or later.

## Usage

Run checks:

```bash
pnpm mejora
```

Force the baseline to accept regressions:

```bash
pnpm mejora --force
```

JSON output for CI and automation:

```bash
pnpm mejora --json
```

Run only a subset of checks:

```bash
pnpm mejora --only "eslint > *"
```

Skip checks:

```bash
pnpm mejora --skip typescript
```

## Configuration

Create one of:

- `mejora.config.ts`
- `mejora.config.js`
- `mejora.config.mjs`
- `mejora.config.mts`

Example:

```ts
import { defineConfig, eslint, typescript } from "mejora";

export default defineConfig({
  checks: {
    "eslint > no-nested-ternary": eslint({
      files: ["src/**/*.{ts,tsx,js,jsx}"],
      overrides: {
        rules: {
          "no-nested-ternary": "error",
        },
      },
    }),
    "typescript": typescript({
      overrides: {
        compilerOptions: {
          noImplicitAny: true,
        },
      },
    }),
  },
});
```

Each entry in `checks` is an explicit check.
The object key is the check identifier and is used in the baseline.

## Supported checks

### ESLint

- Snapshot type: items
- Each lint message is treated as an item
- Regressions are new lint messages

> [!NOTE]
> `eslint` (^9.34.0) is required as a peer dependency when using the ESLint check

### TypeScript

- Snapshot type: items
- Each compiler diagnostic is treated as an item
- Regressions are new diagnostics
- Uses the nearest `tsconfig.json` by default, or an explicit one if provided

> [!NOTE]
> `typescript` (^5.0.0) is required as a peer dependency when using the TypeScript check

## Snapshot type

### Items

```json
{ "type": "items", "items": ["file.ts:12", "file.ts:45"] }
```

Fails if new items appear.
Order does not matter.

## Baseline

Default location:

```txt
.mejora/baseline.json
```

Example:

```json
{
  "version": 1,
  "checks": {
    "eslint > no-nested-ternary": {
      "type": "items",
      "items": ["src/a.ts:1"]
    }
  }
}
```

The baseline represents the last accepted state.

## Improvements and baseline updates

When a run produces fewer items than the baseline, the run passes and the baseline is updated automatically to reflect the improvement.

This includes items that no longer exist in the codebase.

Improvements are reported separately from regressions so progress is visible.

## CI behavior

When running in CI, mejora does not write the baseline.

Instead, it compares the committed baseline to the expected results from the current codebase.

If there is any difference between the committed baseline and the expected results, the run fails.

## Force mode

`mejora --force` updates the baseline even when regressions are present.

## Exit codes

- `0` pass or improvement
- `1` regression detected or baseline out of sync
- `2` configuration or runtime error

## Output

- Default output is plain text
- No prompts
- No interactive behavior
- `--json` produces structured, deterministic output

## Merge Conflicts

mejora automatically resolves conflicts in both `baseline.json` and `baseline.md`:

```bash
# After merging branches with baseline changes
$ git status
  both modified:   .mejora/baseline.json
  both modified:   .mejora/baseline.md

# Just run mejora - both files are auto-resolved
$ mejora
Merge conflict detected in baseline, auto-resolving...
✓ Baseline conflict resolved

# Commit the resolved files
$ git add .mejora/
$ git commit -m "Merge feature branch"
```

## Inspiration

`mejora` is inspired by [betterer](https://phenomnomnominal.github.io/betterer/).
