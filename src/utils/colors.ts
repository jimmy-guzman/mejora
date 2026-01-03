import { styleText } from "node:util";

const createColor = (format: Parameters<typeof styleText>[0]) => {
  return (value: number | string) => {
    return styleText(
      format,
      typeof value === "number" ? value.toString() : value,
    );
  };
};

export const blue = createColor("blue");

export const bold = createColor("bold");

export const cyan = createColor("cyan");

export const dim = createColor("dim");

export const green = createColor("green");

export const red = createColor("red");

export const gray = createColor("gray");

export const underline = createColor("underline");

export const yellow = createColor("yellow");
