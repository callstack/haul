/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 *
 * @flow
 */

/**
 * Get env vars
 */
const {
  HAUL_PLATFORM,
  HAUL_OPTIONS,
  HAUL_DIRECTORY,
  HAUL_SOCKET_ADDRESS,
} = process.env;

if (
  !HAUL_PLATFORM ||
  !HAUL_OPTIONS ||
  HAUL_OPTIONS.length <= 2 ||
  !HAUL_DIRECTORY ||
  !HAUL_SOCKET_ADDRESS
) {
  throw new Error('Unable to create worker due to missing env variables');
}

require('./initWorker')({
  platform: HAUL_PLATFORM,
  options: HAUL_OPTIONS,
  socketAddress: HAUL_SOCKET_ADDRESS,
});
