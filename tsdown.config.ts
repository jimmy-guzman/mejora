import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/{index,run,check-worker}.ts"],
  minify: true,
  publint: true,
});
