import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/{index,run}.ts", "./src/workers/**/!(*.spec).ts"],
  minify: true,
  publint: true,
});
