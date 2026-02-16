export { defineConfig } from "./core/config";
export { defineCheck } from "./core/define-check";
export { eslint } from "./runners/eslint";
export { regex } from "./runners/regex";
export { typescript } from "./runners/typescript";
export type {
  Check,
  Config,
  Issue,
  IssueInput,
  RawSnapshot,
  Snapshot,
} from "./types";
export type { CheckRunner } from "@/types";
