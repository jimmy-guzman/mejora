export const sortById = <T extends { id: string }>(a: T, b: T) => {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};
