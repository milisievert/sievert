import { createSignal } from './signals.js';

export function computed<T>(fn: () => T) {
  return createSignal(fn);
}
