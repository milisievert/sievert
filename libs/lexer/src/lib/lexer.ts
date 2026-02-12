import type { AttrToken, ElementToken, TextToken, Token } from './token.js';

const START_TAG = /^<[a-z]$/;
const TAG_NAME = /^[a-z]+[^\s/>]*$/;
const ATTR_NAME = /^[^\s=/>]+$/; // TODO: consider allowing = as leading char
const END_TAG = /^<\/$/;
const WS = /^[\s]+$/;
const WS_GLOBAL = /[\s]+/g;
const WS_AND_SLASH = /^[\s/]+$/;
const WS_AND_GT = /^[\s>]+$/;
const NEW_LINE = /\r?\n|\r/;

const voidElements = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

function addTokens(
  str: string,
  tokens: (ElementToken | TextToken)[],
  takeUntilEndTag = '',
): number {
  let buffer = '';
  let i = 0;

  const checkEnd = () => i >= str.length;
  const checkBuffer = () => buffer.length > 0 && !WS.test(buffer);

  while (i < str.length) {
    if (buffer.length === 0) {
      buffer += str[i++].replace(NEW_LINE, ' ');
    }

    /*
     * TODO: random < breaks parsing (invalid attribute names, check which characters to avoid)
     * - validate attribute names in parser or lexer?
     */
    if (START_TAG.test(buffer[buffer.length - 1] + str[i])) {
      // text
      if (buffer.length > 1) {
        const text = buffer.substring(0, buffer.length - 1);

        if (!WS.test(text)) {
          tokens.push({
            type: 'text',
            text: text,
          });
        }
      }

      buffer = '';

      const token: ElementToken = {
        type: 'element',
        name: '',
        children: [],
        attributes: [],
      };

      while (TAG_NAME.test(token.name + str[i])) {
        token.name += str[i++];

        if (checkEnd()) {
          return str.length;
        }
      }

      while (WS_AND_SLASH.test(str[i])) {
        i++;
      }

      if (checkEnd()) {
        return str.length;
      }

      // attributes
      while (str[i] !== '>') {
        const attr: AttrToken = {
          type: 'attr',
          name: '',
          value: '',
        };

        while (ATTR_NAME.test(attr.name + str[i])) {
          attr.name += str[i++];

          if (checkEnd()) {
            return str.length;
          }
        }

        while (WS.test(str[i])) {
          i++;
        }

        if (checkEnd()) {
          return str.length;
        }

        // attr value
        if (str[i] === '=') {
          // skip =
          i++;

          while (WS.test(str[i])) {
            i++;
          }

          if (checkEnd()) {
            return str.length;
          }

          if (str[i] === '"') {
            // double quotes
            while (str[++i] !== '"') {
              if (checkEnd()) {
                return str.length;
              }

              attr.value += str[i];
            }

            //skip "
            i++;

            if (checkEnd()) {
              return str.length;
            }
          } else if (str[i] === "'") {
            // single quotes
            while (str[++i] !== "'") {
              if (checkEnd()) {
                return str.length;
              }

              attr.value += str[i];
            }

            // skip '
            i++;

            if (checkEnd()) {
              return str.length;
            }
          } else {
            // no quotes
            while (!WS_AND_GT.test(str[i])) {
              attr.value += str[i++];

              if (checkEnd()) {
                return str.length;
              }
            }
          }
        }

        token.attributes.push(attr);

        while (WS_AND_SLASH.test(str[i])) {
          i++;
        }
      }

      // skip >
      i++;

      // tokenize children
      if (!voidElements.includes(token.name)) {
        i += addTokens(str.substring(i), token.children, token.name);
      }

      trimWhitespace(token.children);
      tokens.push(token);
      continue;
    }

    if (END_TAG.test(buffer[buffer.length - 1] + str[i])) {
      // skip <
      buffer = buffer.substring(0, buffer.length - 1);

      // skip /
      i++;

      let name = '';
      let skip = false;

      while (str[i] !== '>') {
        // ignore everything after whitespace or slash
        if (WS_AND_SLASH.test(str[i])) {
          skip = true;
        }

        if (!skip) {
          name += str[i];
        }

        // check end
        if (++i >= str.length) {
          // text
          if (checkBuffer()) {
            tokens.push({
              type: 'text',
              text: buffer,
            });
          }

          return str.length;
        }
      }

      // skip >
      i++;

      // skip unexpected end tags
      if (name === takeUntilEndTag) {
        // text
        if (checkBuffer()) {
          tokens.push({
            type: 'text',
            text: buffer,
          });
        }

        return i;
      }

      if (checkEnd()) {
        // text
        if (checkBuffer()) {
          tokens.push({
            type: 'text',
            text: buffer,
          });
        }

        return str.length;
      }
    }

    // add to buffer
    buffer += str[i++].replace(NEW_LINE, ' ');
  }

  // text
  if (checkBuffer()) {
    tokens.push({
      type: 'text',
      text: buffer,
    });
  }

  return i;
}

function trimWhitespace(tokens: Token[]): void {
  if (tokens.some((t) => t.type === 'element')) {
    const start = tokens.findLastIndex((t) => t.type === 'text');

    for (let i = start; i >= 0; i--) {
      const t = tokens[i];

      if (t.type === 'text' && WS.test(t.text)) {
        tokens.splice(i, 1);
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === 'text') {
      t.text = t.text.replaceAll(WS_GLOBAL, ' ');
    }
  }
}

export function tokenize(str: string): (ElementToken | TextToken)[] {
  const tokens: (ElementToken | TextToken)[] = [];
  addTokens(str.trim(), tokens);
  trimWhitespace(tokens);
  return tokens;
}
