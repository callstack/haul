/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */

// @todo transpile on build
require("babel-register")({
  plugins: ["transform-flow-strip-types"],
  retainLines: true,
  sourceMaps: "inline",
  babelrc: false
});

require("./cli");
