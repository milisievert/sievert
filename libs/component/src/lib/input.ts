import { createSource } from '@sievert/graph';
import { getContext } from '@sievert/renderer';
import { createSignal, type Signal } from '@sievert/signals';

type InputOptions<T> = { value: T } | { required: boolean };

export function input<T>(name: string): Signal<T | undefined>;

export function input<T>(
  name: string,
  options: { required: false },
): Signal<T | undefined>;

export function input<T>(name: string, options: { required: true }): Signal<T>;

export function input<T>(name: string, options: { value: T }): Signal<T>;

export function input<T>(name: string, options?: InputOptions<T>) {
  const context = getContext();

  if (context === null) {
    throw new Error(`input("${name}") called outside component context`);
  }

  const node = createSource((options as { value?: T })?.value);

  if (context.inputs.has(name)) {
    throw new Error(`Duplicate input name "${name}"`);
  }

  context.inputs.set(name, {
    source: node,
    required: (options as { required?: boolean })?.required ?? false,
  });

  return createSignal(node);
}
