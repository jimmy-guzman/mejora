import { defineConfig } from "tsdown";

export default defineConfig({
  deps: {
    onlyBundle: ["lilconfig", "pathe"],
  },
  entry: ["./src/{index,run,cli}.ts", "./src/workers/**/!(*.spec).ts"],
  minify: true,
  publint: true,
});
