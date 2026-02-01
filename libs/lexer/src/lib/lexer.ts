import type { Token } from './token.js';

const patterns = {
  startTag: /^<[a-z]$/,
  tagName: /^[a-z]+[^\s/>]*$/,
  attributeName: /^[^\s=/>]+$/,
  endTag: /^<\/$/,
  whitespace: /^[\s]+$/,
  whitespaceAll: /[\s]+/g,
  whitespaceAndSlash: /^[\s/]+$/,
  whitespaceAndGt: /^[\s>]+$/,
  newLine: /^\n$/,
};

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

function addTokens(str: string, tokens: Token[], takeUntilEndTag = ''): number {
  let buffer = '';
  let i = 0;

  while (i < str.length) {
    // skip empty buffer
    if (buffer.length === 0) {
      buffer += str[i++].replace(patterns.newLine, ' ');
    }

    /*
     * TODO: random < breaks parsing (invalid attribute names, check which characters to avoid)
     * - validate attribute names in parser or lexer?
     */
    // start tag
    if (patterns.startTag.test(buffer[buffer.length - 1] + str[i])) {
      // text
      if (buffer.length > 1) {
        const text = buffer.substring(0, buffer.length - 1);
        if (!patterns.whitespace.test(text)) {
          tokens.push({
            type: 'text',
            text: text,
          });
        }
      }

      // clear buffer
      buffer = '';

      const token: Token.Element = {
        type: 'element',
        name: '',
        children: [],
        attributes: [],
      };

      // tag name
      while (patterns.tagName.test(token.name + str[i])) {
        token.name += str[i++];

        // check for end
        if (i >= str.length) {
          return str.length;
        }
      }

      // skip whitespace and slashes
      while (patterns.whitespaceAndSlash.test(str[i])) {
        i++;
      }

      // check for end
      if (i >= str.length) {
        return str.length;
      }

      // attributes
      while (str[i] !== '>') {
        const attr: Token.Attr = {
          type: 'attr',
          name: '',
          value: '',
        };

        // attr name
        while (patterns.attributeName.test(attr.name + str[i])) {
          attr.name += str[i++];

          // check for end
          if (i >= str.length) {
            return str.length;
          }
        }

        // skip whitespace
        while (patterns.whitespace.test(str[i])) {
          i++;
        }

        // check for end
        if (i >= str.length) {
          return str.length;
        }

        // attr value
        if (str[i] === '=') {
          // skip =
          i++;

          // skip whitespace
          while (patterns.whitespace.test(str[i])) {
            i++;
          }

          // check for end
          if (i >= str.length) {
            return str.length;
          }

          if (str[i] === '"') {
            // double quotes
            while (str[++i] !== '"') {
              // check for end
              if (i >= str.length) {
                return str.length;
              }

              attr.value += str[i];
            }

            //skip "
            i++;

            // check for end
            if (i >= str.length) {
              return str.length;
            }
          } else if (str[i] === "'") {
            // single quotes
            while (str[++i] !== "'") {
              // check for end
              if (i >= str.length) {
                return str.length;
              }

              attr.value += str[i];
            }

            // skip '
            i++;

            // check for end
            if (i >= str.length) {
              return str.length;
            }
          } else {
            // no quotes
            while (!patterns.whitespaceAndGt.test(str[i])) {
              attr.value += str[i++];

              // check for end
              if (i >= str.length) {
                return str.length;
              }
            }
          }
        }

        token.attributes.push(attr);

        // skip whitespace and slashes
        while (patterns.whitespaceAndSlash.test(str[i])) {
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

    // TODO: random </ has weird behavior
    // end tag
    if (patterns.endTag.test(buffer[buffer.length - 1] + str[i])) {
      // skip <
      buffer = buffer.substring(0, buffer.length - 1);

      // skip /
      i++;

      // tag name
      let name = '';
      let skip = false;

      while (str[i] !== '>') {
        // ignore everything after whitespace or slash
        if (patterns.whitespaceAndSlash.test(str[i])) {
          skip = true;
        }

        if (!skip) {
          name += str[i];
        }

        // check for end
        if (++i >= str.length) {
          // text
          if (buffer.length > 0 && !patterns.whitespace.test(buffer)) {
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

      // skip void and unexpected end tags
      if (name === takeUntilEndTag) {
        // text
        if (buffer.length > 0 && !patterns.whitespace.test(buffer)) {
          tokens.push({
            type: 'text',
            text: buffer,
          });
        }

        return i;
      }

      // check for end
      if (i >= str.length) {
        // text
        if (buffer.length > 0 && !patterns.whitespace.test(buffer)) {
          tokens.push({
            type: 'text',
            text: buffer,
          });
        }

        return str.length;
      }
    }

    // add to buffer
    buffer += str[i++].replace(patterns.newLine, ' ');
  }

  // text
  if (buffer.length > 0 && !patterns.whitespace.test(buffer)) {
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

      if (t.type === 'text' && patterns.whitespace.test(t.text)) {
        tokens.splice(i, 1);
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === 'text') {
      t.text = t.text.replaceAll(patterns.whitespaceAll, ' ');
    }
  }
}

export function tokenize(str: string): Token[] {
  const tokens: Token[] = [];
  addTokens(str.trim(), tokens);
  trimWhitespace(tokens);
  return tokens;
}
