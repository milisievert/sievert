import { createOutputRef, getContext } from '@sievert/renderer';

type OutputOptions<T> = {
  name: string;
  eventInitDict?: Omit<CustomEventInit<T>, 'detail'>;
};

export function output<T = void>(options: OutputOptions<T>) {
  const context = getContext();

  if (!context) {
    throw new Error(
      `output("${options.name}") called outside component context`,
    );
  }

  const ref = createOutputRef(options.name, options?.eventInitDict ?? {});
  context.outputs.add(ref);

  return (detail: T) => ref.dispatcher(detail);
}
