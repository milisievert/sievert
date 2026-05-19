import { createTransform } from '@sievert/graph';
import { createSignal, type Signal } from './signals.js';

export function computed<T>(fn: () => T): Signal<T> {
  const node = createTransform(fn);
  return createSignal(node);
}
