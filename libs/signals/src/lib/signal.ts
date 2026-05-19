import { createSource } from '@sievert/graph';
import { createWritableSignal, type WritableSignal } from './signals.js';

export function signal<T>(value: T): WritableSignal<T> {
  const node = createSource(value);
  return createWritableSignal(node);
}
