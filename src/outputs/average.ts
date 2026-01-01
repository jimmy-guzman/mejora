export function average(totalDuration: number | undefined, count: number) {
  if (totalDuration === undefined || count === 0) return undefined;

  return totalDuration / count;
}
