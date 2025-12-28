import type { KnipConfig } from "knip";

export default {
  ignoreDependencies: [
    "gitzy",
    "@commitlint/config-conventional",
    "commitlint",
    "@gunshi/docs",
    "eslint",
  ],
} satisfies KnipConfig;
