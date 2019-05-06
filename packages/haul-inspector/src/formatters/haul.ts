import { container, color, modifier, pad } from 'ansi-fragments';

export function formatHaulMessage(pid: number, message: string) {
  return container(
    color('blue', modifier('bold', `haul(${pid})`)),
    pad(1),
    '▶︎',
    pad(1),
    message
  ).build();
}

export function formatHaulError(pid: number, error: Error) {
  return container(
    color('blue', modifier('bold', `haul(${pid}) error`)),
    pad(1),
    '▶︎',
    pad(1),
    color('red', error.message)
  ).build();
}
