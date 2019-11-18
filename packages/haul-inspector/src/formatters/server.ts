import { container, color, modifier, pad } from 'ansi-fragments';

export function formatServerMessage(message: string) {
  return container(
    color('magenta', modifier('bold', 'server')),
    pad(1),
    '▶︎',
    pad(1),
    message
  ).build();
}

export function formatServerError(error: Error) {
  return container(
    color('magenta', modifier('bold', 'server error')),
    pad(1),
    '▶︎',
    pad(1),
    color('red', error.message)
  ).build();
}
