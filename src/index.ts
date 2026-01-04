export type { CheckRunner } from "./check-runner";
export { defineConfig } from "./config";
export { eslintCheck as eslint, eslintCheck } from "./runners/eslint";
export {
  typescriptCheck as typescript,
  typescriptCheck,
} from "./runners/typescript";
export type { Config, FindingInput } from "./types";
