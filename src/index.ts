export type { CheckRunner } from "./check-runner";
export { defineConfig } from "./config";
export { eslintCheck as eslint, eslintCheck } from "./runners/eslint";
export { regexCheck as regex, regexCheck, regexRunner } from "./runners/regex";
export {
  typescriptCheck as typescript,
  typescriptCheck,
} from "./runners/typescript";
export type { Config, Issue, IssueInput, RawSnapshot, Snapshot } from "./types";
