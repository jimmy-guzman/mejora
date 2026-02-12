import { env } from "node:process";

const isInCi = ["CI", "CONTINUOUS_INTEGRATION"].some(
  (key) => env[key] && env[key] !== "0" && env[key] !== "false",
);

export default isInCi;
