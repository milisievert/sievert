import { parse } from '@sievert/parser';
import { render } from './renderer.js';
import { randomBase36 } from './random.js';
import {
  type RenderContext,
  createContext,
  getContext,
} from './context/render-context.js';
import { isDirective } from '@sievert/directive';

export type HtmlResult = {
  documentFragment: DocumentFragment;
  context: RenderContext;
};

function generatePlaceholders(expressions: unknown[]) {
  const keys = new Array<string>(expressions.length);
  const placeholders = new Array<string>(expressions.length);

  for (let i = 0; i < expressions.length; i++) {
    const key = `sv_${randomBase36()}`;
    keys[i] = key;

    if (isDirective(expressions[i])) {
      placeholders[i] = `<sv-directive key="${key}" />`;
    } else {
      placeholders[i] = key;
    }
  }

  return { keys, placeholders };
}

export function html(
  parts: TemplateStringsArray,
  ...expressions: unknown[]
): HtmlResult {
  const context = getContext() ?? createContext();
  const { keys, placeholders } = generatePlaceholders(expressions);

  const nodes = parse(String.raw(parts, ...placeholders));
  const documentFragment = render(nodes, keys, expressions, context);

  return { documentFragment, context };
}
