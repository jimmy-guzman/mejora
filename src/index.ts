export { defineConfig, loadConfig } from "./core/config";
export { defineCheck } from "./core/define-check";
export { buildRunOutput } from "./outputs/json";
export type { RunOutput } from "./outputs/json";
export { run } from "./run";
export { eslint } from "./runners/eslint";
export { regex } from "./runners/regex";
export { typescript } from "./runners/typescript";
export type {
  Check,
  CheckResult,
  Config,
  Issue,
  IssueInput,
  RawSnapshot,
  RunOptions,
  RunResult,
  Snapshot,
} from "./types";
export type { CheckRunner } from "@/types";
