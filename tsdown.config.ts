import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/{index,run}.ts", "./src/check-worker.ts"],
  minify: true,
  publint: true,
});
