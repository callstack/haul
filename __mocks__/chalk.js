/**
 * For the CI we need mock Chalk, this is way how to do it simply.
 * 
 * chalk.what.ever.lol("text") will be resolved as "text"
 * chalk.pls("yes") will be resolved as "yes"
 */
module.exports = new Proxy(
  {},
  {
    get: function get() {
      return new Proxy(() => {}, {
        get,
        apply: (target, that, [text]) => text,
      });
    },
  }
);
