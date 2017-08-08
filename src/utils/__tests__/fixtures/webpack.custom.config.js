module.exports = {
  entry: '/some/file.js',
  plugins: [],
  module: {
    rules: [{ parser: { requireEnsure: false } }],
  },
  resolve: {},
};
