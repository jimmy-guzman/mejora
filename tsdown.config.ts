import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/{index,run}.ts", "./src/workers/**/!(*.spec).ts"],
  inlineOnly: ["is-in-ci", "lilconfig", "pathe"],
  minify: true,
  publint: true,
});
