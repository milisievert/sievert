import { getContext } from '@sievert/renderer';
import { createOutputRef } from '../../../renderer/src/lib/context/output-ref.js';

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
