import { tokenize } from '@sievert/lexer';
import { parse } from './parser.js';

export function html(
  parts: TemplateStringsArray,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...expressions: any[]
) {
  const keys = expressions.map(() => crypto.randomUUID());
  const template = String.raw(parts, ...keys);

  return parse({
    tokens: tokenize(template),
    params: { keys, expressions },
  });
}
