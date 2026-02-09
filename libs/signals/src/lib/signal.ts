import { createWritableSignal } from './signals.js';

export function signal<T>(value: T) {
  return createWritableSignal(value);
}
