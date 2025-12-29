import { styleText } from "node:util";

/**
 * Simple color abstraction over Node.js's styleText
 * Provides a picocolors-like API for the colors we actually use
 */

export const blue = (text: string) => {
  return styleText("blue", text);
};

export const bold = (text: string) => {
  return styleText("bold", text);
};

export const cyan = (text: string) => {
  return styleText("cyan", text);
};

export const dim = (text: string) => {
  return styleText("dim", text);
};

export const green = (text: string) => {
  return styleText("green", text);
};

export const greenBright = (text: string) => {
  return styleText("greenBright", text);
};

export const red = (text: string) => {
  return styleText("red", text);
};

export const bgRed = (text: string) => {
  return styleText("bgRed", text);
};

export const yellow = (text: string) => {
  return styleText("yellow", text);
};

export const black = (text: string) => {
  return styleText("black", text);
};
