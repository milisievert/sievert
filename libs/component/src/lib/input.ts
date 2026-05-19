import { createSource } from '@sievert/graph';
import { getContext } from '@sievert/renderer';
import { createSignal, type Signal } from '@sievert/signals';

type InputOptions<T, TRequired extends boolean> = {
  name: string;
  value?: T;
  required?: TRequired;
};

export function input<T>(options: { name: string }): Signal<T | undefined>;
export function input<T>(options: { name: string; value: T }): Signal<T>;
export function input<T>(options: { name: string; required: true }): Signal<T>;
export function input<T>(options: {
  name: string;
  required: false;
}): Signal<T | undefined>;

export function input<T, TRequired extends boolean = false>(
  options: InputOptions<T, TRequired>,
) {
  const context = getContext();

  if (context === null) {
    throw new Error(`input("${options.name}") called outside component context`);
  }

  if (context.inputs.has(options.name)) {
    throw new Error(`Duplicate input name "${options.name}"`);
  }

  const source = createSource(options.value);

  context.inputs.set(options.name, {
    source: source,
    required: options.required ?? false,
  });

  return createSignal(source);
}
