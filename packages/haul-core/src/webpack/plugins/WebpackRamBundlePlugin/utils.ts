export const countLines = (string: string) =>
  (string.match(/\r\n?|\n|\u2028|\u2029/g) || []).length;
