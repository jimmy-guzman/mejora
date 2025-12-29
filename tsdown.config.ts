import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/{index,run}.ts"],
  minify: true,
  publint: true,
});
