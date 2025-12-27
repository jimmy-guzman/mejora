import type { KnipConfig } from "knip";

export default {
  ignoreDependencies: [
    "gitzy",
    "@commitlint/config-conventional",
    "commitlint",
  ],
} satisfies KnipConfig;
