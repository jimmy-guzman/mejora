import * as c from "./colors";

function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;

  const seconds = ms / 1000;

  if (seconds < 60) {
    return seconds % 1 === 0 ? `${seconds}s` : `${seconds.toFixed(1)}s`;
  }

  const minutes = ms / 60_000;

  if (minutes < 60) {
    return minutes % 1 === 0 ? `${minutes}m` : `${minutes.toFixed(1)}m`;
  }

  const hours = ms / 3_600_000;

  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
}

export function formatDuration(duration: number) {
  const rounded = Math.round(duration);

  if (rounded < 1) {
    return c.dim("<1ms");
  }

  const formatted = formatMs(rounded);

  if (rounded < 100) {
    return c.greenBright(formatted);
  }

  if (rounded < 1000) {
    return c.yellow(formatted);
  }

  return c.red(formatted);
}
