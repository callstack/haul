/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

const chalk = require('chalk');
const dedent = require('dedent');

module.exports = () => dedent`
  Unable to open in editor. You can set environment variables to open your editor.

  --- Easiest (auto-detect) ---

    ${chalk.bold('export HAUL_EDITOR=code')}
    ${chalk.gray('or')}
    ${chalk.bold('export HAUL_EDITOR=/path/to/atom')}
    ${chalk.gray('or')}
    ${chalk.bold('export REACT_EDITOR=/usr/local/bin/vim')}

    ${chalk.gray('(sublime, atom, code, webstorm, phpstorm, idea14ce, vim, emacs, visualstudio)')}
    ${chalk.gray('via https://github.com/lahmatiy/open-in-editor')}


  --- Harder (you have a custom script or symlink) ---

    ${chalk.bold('export HAUL_EDITOR=sublime')}
    ${chalk.bold('export HAUL_EDITOR_CMD="/Users/steve/betas/Sublime Beta.app"')}
  

  --- Hardest (completely custom -- hold my beer) ---

    ${chalk.bold('export HAUL_EDITOR_CMD=/path/to/a/crazy/editor')}
    ${chalk.bold('export HAUL_EDITOR_PATTERN="-r -g {filename}:{line}:{column}"')}
`;
