declare module "*.sql" {
  const filenames: string[];
  export { filenames };

  const default_values: { default: string }[];
  export default default_values;
}
