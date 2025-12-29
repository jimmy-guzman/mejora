# mejora

Prevent regressions by allowing only improvement.

`mejora` runs checks, compares their results to a stored baseline, and fails only when things get worse.

If results improve or stay the same, the run passes.

---

## What problem it solves

Most tools ask: _“Is this perfect?”_
`mejora` asks: _“Did this regress?”_

This makes it practical for:

- large or legacy codebases
- incremental cleanup
- CI enforcement without blocking progress

---

## How it works

1. Each check produces a snapshot, a list of items
2. The snapshot is compared to a baseline
3. New items cause failure
4. Removed items are treated as improvement

Baselines are explicit and committed to the repo.

---

## Installation

```bash
pnpm add -D mejora
```

---

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

---

## Configuration

Create one of:

- `mejora.config.ts`
- `mejora.config.js`
- `mejora.config.mjs`
- `mejora.config.mts`

Example:

```ts
import { defineConfig, eslintCheck, typescriptCheck } from "mejora";

export default defineConfig({
  checks: {
    "eslint > no-nested-ternary": eslintCheck({
      files: ["src/**/*.{ts,tsx,js,jsx}"],
      overrides: {
        rules: {
          "no-nested-ternary": "error",
        },
      },
    }),
    "typescript": typescriptCheck({
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

---

## Supported checks

### ESLint

- Snapshot type: items
- Each lint message is treated as an item
- Regressions are new lint messages
- **`eslint` is required as a peer dependency when using the ESLint check**

### TypeScript

- Snapshot type: items
- Each compiler diagnostic is treated as an item
- Regressions are new diagnostics
- Uses the nearest `tsconfig.json` by default, or an explicit one if provided
- **`typescript` is required as a peer dependency when using the TypeScript check**

---

## Snapshot type

### Items

```json
{ "type": "items", "items": ["file.ts:12", "file.ts:45"] }
```

Fails if new items appear.
Order does not matter.

---

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

---

## Improvements and baseline updates

When a run produces fewer items than the baseline, the run passes and the baseline is updated automatically to reflect the improvement.

This includes items that no longer exist in the codebase.

Improvements are reported separately from regressions so progress is visible.

---

## CI behavior

When running in CI, mejora does not write the baseline.

Instead, it compares the committed baseline to the expected results from the current codebase.

If there is any difference between the committed baseline and the expected results, the run fails.

This ensures the baseline always reflects the real state of the codebase.

---

## Force mode

`mejora --force` updates the baseline even when regressions are present.

This is an explicit action and should be used sparingly.

---

## Exit codes

- `0` pass or improvement
- `1` regression detected or baseline out of sync
- `2` configuration or runtime error

---

## Output

- Default output is plain text
- No prompts
- No interactive behavior
- `--json` produces structured, deterministic output

Designed to work cleanly in CI and automation.

---

## Inspiration

mejora is inspired by the ideas behind [betterer](https://phenomnomnominal.github.io/betterer/).

The core concept of preventing regressions through baselines comes from that work. mejora reimplements the idea with a smaller scope and a simpler, more opinionated design.
