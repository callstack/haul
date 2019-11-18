export default function compileTemplate(
  template: string,
  data: { [key: string]: string }
) {
  return Object.keys(data).reduce((compiled: string, key: string) => {
    return compiled.replace(`[${key}]`, data[key]);
  }, template);
}
