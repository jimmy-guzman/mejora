/**
 * Process items concurrently with a maximum concurrency limit.
 */
export async function poolMap<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
) {
  const results = Array.from<R>({ length: items.length });

  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const currentIndex = index++;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know item exists
      results[currentIndex] = await fn(items[currentIndex]!);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );

  return results;
}
