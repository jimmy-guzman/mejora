const DEFAULT_IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
];

/**
 * Resolve ignore patterns for glob operations.
 *
 * If custom ignore patterns are provided, uses those.
 * Otherwise, uses defaults and adds prefixed versions for any directory
 * prefixes found in file patterns (e.g., "src/" in "src/**\/*.ts").
 */
export function resolveIgnorePatterns(
  filePatterns: string[],
  customIgnore?: string[],
) {
  if (customIgnore?.length) {
    return customIgnore;
  }

  const prefixes = filePatterns
    .map((pattern) => /^([^*]+\/)/.exec(pattern)?.[1])
    .filter((pattern): pattern is string => pattern !== undefined);

  return [
    ...DEFAULT_IGNORE_PATTERNS,
    ...prefixes.flatMap((prefix) => {
      return DEFAULT_IGNORE_PATTERNS.map((pattern) => {
        return pattern.replace(/^\*\*\//, prefix);
      });
    }),
  ];
}
