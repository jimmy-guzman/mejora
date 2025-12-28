import { ms } from "ms";
import pc from "picocolors";

export function formatDuration(duration: number) {
  const rounded = Math.round(duration);

  if (rounded < 1) {
    return pc.dim("<1ms");
  }

  const formatted = ms(rounded, { long: false });

  if (rounded < 100) {
    return pc.greenBright(formatted);
  }

  if (rounded < 1000) {
    return pc.yellow(formatted);
  }

  return pc.red(formatted);
}
