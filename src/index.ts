export type { CheckRunner } from "./check-runner";
export { eslintCheck as eslint, eslintCheck } from "./checks/eslint";
export {
  typescriptCheck as typescript,
  typescriptCheck,
} from "./checks/typescript";
export { defineConfig } from "./config";
export type { Config, FindingInput } from "./types";
