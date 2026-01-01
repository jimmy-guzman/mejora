# mejora

> Prevent regressions. Allow improvement.
> _mejora_ (Spanish for "improvement")

![actions][actions-badge]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npmtrends]
[![Install Size][install-size-badge]][packagephobia]

`mejora` runs [checks](#supported-checks), compares them to a stored baseline, and fails only when things get worse.

## Behavior

Each check produces a snapshot.

Snapshots are compared against a baseline.

- New items are regressions and fail the run
- Removed items are improvements and pass the run

Snapshots use the `items` format with structured diagnostic information:

```json
{
  "checks": {
    "eslint": {
      "type": "items",
      "items": [
        {
          "id": "a1b2c3d4...",
          "file": "src/example.ts",
          "line": 12,
          "column": 5,
          "code": "no-unused-vars",
          "message": "'foo' is declared but never used"
        }
      ]
    }
  }
}
```

The baseline represents the last accepted state and should be committed to the repository.

Default location:

```txt
.mejora/baseline.json
```

When a run produces fewer items than the baseline, the run passes and the baseline is updated automatically.

Regressions fail the run.

`mejora --force` updates the baseline even when regressions are present.

### Output

Output is non-interactive and deterministic.

- Plain text by default
- Markdown output for human-friendly review and navigation
- `--json` produces structured output for CI and automation

### Exit Codes

- `0` pass or improvement
- `1` regression detected or baseline out of sync
- `2` configuration or runtime error

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

## Supported Checks

### ESLint

- Snapshot type: `"items"`
- Each lint message is treated as an item
- Regressions are new lint messages

> [!NOTE]
> `eslint` (^9.34.0) is required as a peer dependency when using the ESLint check

### TypeScript

- Snapshot type: `"items"`
- Each compiler diagnostic is treated as an item
- Regressions are new diagnostics
- Uses the nearest `tsconfig.json` by default, or an explicit one if provided

> [!NOTE]
> `typescript` (^5.0.0) is required as a peer dependency when using the TypeScript check

## CI

When running in CI, mejora does not write the baseline.

Instead, it compares the committed baseline to the expected results from the current codebase.

If there is any difference between the committed baseline and the expected results, the run fails.

## Merge Conflicts

`mejora` automatically resolves conflicts in both `baseline.json` and `baseline.md`:

```bash
# After merging branches with baseline changes
$ git status
  both modified:   .mejora/baseline.json
  both modified:   .mejora/baseline.md

# Just run mejora - both files are auto-resolved
$ mejora
Merge conflict detected in baseline, auto-resolving...
✔ Baseline conflict resolved

# Commit the resolved files
$ git add .mejora/
$ git commit -m "Merge feature branch"
```

## Credits

- `mejora` is inspired by [betterer](https://phenomnomnominal.github.io/betterer/).

[actions-badge]: https://img.shields.io/github/actions/workflow/status/jimmy-guzman/mejora/cd.yml?style=flat-square&logo=github-actions
[version-badge]: https://img.shields.io/npm/v/mejora?style=flat-square&logo=npm
[package]: https://www.npmjs.com/package/mejora
[downloads-badge]: https://img.shields.io/npm/dm/mejora?style=flat-square&logo=npm
[npmtrends]: https://www.npmtrends.com/mejora
[packagephobia]: https://packagephobia.com/result?p=mejora
[install-size-badge]: https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json%3Fp=mejora&query=$.install.pretty&label=install%20size&style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDggMTA4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzAwNjgzOCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzMyZGU4NSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxwYXRoIGZpbGw9InVybCgjYSkiIGQ9Ik0yMS42NjcgNzMuODA5VjMzLjg2N2wyOC4zMy0xNi4xODggMjguMzM3IDE2LjE4OFY2Ni4xM0w0OS45OTcgODIuMzIxIDM1IDczLjc1VjQxLjYwNGwxNC45OTctOC41N0w2NSA0MS42MDR2MTYuNzg4bC0xNS4wMDMgOC41NzEtMS42NjMtLjk1di0xNi42NzJsOC4zODItNC43OTItNi43MTktMy44MzgtOC4zMyA0Ljc2M1Y2OS44OGw4LjMzIDQuNzYyIDIxLjY3LTEyLjM4M1YzNy43MzdsLTIxLjY3LTEyLjM3OS0yMS42NjMgMTIuMzc5djM5Ljg4TDQ5Ljk5NyA5MCA4NSA3MFYzMEw0OS45OTcgMTAgMTUgMzB2NDB6Ii8+PC9zdmc+
