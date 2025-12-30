export function plural(count: number, singular: string) {
  if (count === 1) {
    return singular;
  }

  return `${singular}s`;
}
