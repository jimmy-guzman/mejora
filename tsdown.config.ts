import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/{index,run}.ts", "./src/workers/**/!(*.spec).ts"],
  inlineOnly: ["lilconfig", "pathe"],
  minify: true,
  publint: true,
});
