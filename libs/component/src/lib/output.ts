import { createOutputRef, getContext } from '@sievert/renderer';

export function output<T = void>(
  name: string,
  eventInitDict: Omit<CustomEventInit<unknown>, 'detail'> = {},
) {
  const context = getContext();

  if (!context) {
    throw new Error(`output("${name}") called outside component context`);
  }

  const ref = createOutputRef(name, eventInitDict);
  context.outputs.add(ref);

  return (detail: T) => ref.dispatcher(detail);
}
