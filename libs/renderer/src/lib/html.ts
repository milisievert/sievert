import { enqueue, tick } from '@sievert/graph';
import { parse } from '@sievert/parser';
import { render } from './renderer.js';
import { randomBase36 } from './random.js';

function generateKeys(count: number) {
  const keys = new Array<string>(count);

  for (let i = 0; i < count; i++) {
    keys[i] = `sv_${randomBase36()}`;
  }

  return keys;
}

export function html(
  parts: TemplateStringsArray,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...expressions: any[]
) {
  const keys = generateKeys(expressions.length);
  const nodes = parse(String.raw(parts, ...keys));

  const result = render(nodes, keys, expressions);

  // TODO: render context
  result.sinks.forEach(enqueue);
  tick();

  return result;
}
