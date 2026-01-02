import { hash as cryptoHash } from "node:crypto";

/**
 * Hashes a string using SHA-256.
 *
 * @param input - The string to hash.
 *
 * @returns The SHA-256 hash of the input string in hexadecimal format.
 */
export const hash = (input: string) => {
  return cryptoHash("sha256", input, "hex");
};
