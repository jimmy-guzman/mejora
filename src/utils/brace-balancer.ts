function removeCloseBraces(json: string, count: number) {
  let result = json;

  for (let i = 0; i < count; i++) {
    const trimmed = result.trimEnd();

    if (!trimmed.endsWith("}")) break;

    result = trimmed.slice(0, -1);
  }

  return result;
}

function addCloseBraces(json: string, count: number) {
  return `${json}${"\n}".repeat(count)}`;
}

/**
 * Balances the number of opening and closing braces in a JSON string.
 *
 * @param json - The JSON string to balance braces for.
 *
 * @returns The JSON string with balanced braces.
 */
export function balanceBraces(json: string) {
  const openBraces = json.match(/\{/g)?.length ?? 0;
  const closeBraces = json.match(/\}/g)?.length ?? 0;
  const delta = openBraces - closeBraces;

  if (delta === 0) return json;

  return delta < 0
    ? removeCloseBraces(json, -delta)
    : addCloseBraces(json, delta);
}
