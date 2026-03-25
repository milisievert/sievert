import { parse } from '@sievert/parser';
import { render } from './renderer.js';

export function html(
  parts: TemplateStringsArray,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...expressions: any[]
) {
  const keys = expressions.map(() => crypto.randomUUID());
  const template = String.raw(parts, ...keys);

  return render({
    tokens: parse(template),
    params: { keys, expressions },
  });
}
