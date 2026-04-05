import { parse } from '@sievert/parser';
import { render } from './renderer.js';
import { randomBase36 } from './random.js';
import {
  type RenderContext,
  createContext,
  getContext,
} from './render-context.js';

export type HtmlResult = {
  documentFragment: DocumentFragment;
  context: RenderContext;
};

function generateKeys(count: number) {
  const keys = new Array<string>(count);

  for (let i = 0; i < count; i++) {
    keys[i] = `sv_${randomBase36()}`;
  }

  return keys;
}

export function html(
  parts: TemplateStringsArray,
  ...expressions: unknown[]
): HtmlResult {
  const context = getContext() ?? createContext();

  const keys = generateKeys(expressions.length);
  const nodes = parse(String.raw(parts, ...keys));
  const documentFragment = render(nodes, keys, expressions, context);

  return { documentFragment, context };
}
