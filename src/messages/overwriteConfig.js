/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

import { DEFAULT_CONFIG_FILENAME } from '../constants';

module.exports = () =>
  `There is already a '${DEFAULT_CONFIG_FILENAME}'. Overwrite it?`;
