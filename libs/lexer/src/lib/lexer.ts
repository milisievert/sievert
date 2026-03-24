import { AttrToken, NodeToken } from './tokens.js';

function isAlpha(code: number) {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isNum(code: number) {
  return code >= 48 && code <= 57;
}

function isWhitespace(code: number) {
  return code === 32 || code === 10 || code === 9 || code === 13;
}

function isTagNameChar(char: string) {
  const code = char.charCodeAt(0);
  return isAlpha(code) || isNum(code) || char === '-';
}

function isAttrNameChar(char: string) {
  const code = char.charCodeAt(0);
  return (
    isAlpha(code) ||
    isNum(code) ||
    char === '-' ||
    char === '_' ||
    char === ':' ||
    char === '@'
  );
}

function isOpeningTagTerminator(char: string) {
  return char === '/' || char === '>';
}

function isUnquotedAttrValueChar(char: string) {
  const code = char.charCodeAt(0);
  return !isWhitespace(code) && !isOpeningTagTerminator(char);
}

export function tokenize(str: string): NodeToken[] {
  let pos = 0;
  let buf = '';

  const peek = () => str[pos];
  const next = () => str[pos++];
  const skip = (count = 1) => (pos += count);

  const hasNext = () => pos < str.length;
  const peekAhead = (offset: number) => str[pos + offset];

  const skipWhitespace = () => {
    while (hasNext() && isWhitespace(peek().charCodeAt(0))) {
      skip();
    }
  };

  const flush = (): NodeToken | undefined => {
    if (!buf) {
      return;
    }

    const content = buf;
    buf = '';

    return { type: 'text', content };
  };

  const readAttribute = (): AttrToken => {
    let name = '';
    let value = '';

    while (hasNext() && isAttrNameChar(peek())) {
      name += next();
    }

    skipWhitespace();

    if (peek() === '=') {
      skip(); // =

      const maybeValueTerminator = peek();

      if (maybeValueTerminator === '"' || maybeValueTerminator === "'") {
        skip(); // " or '

        while (hasNext() && peek() !== maybeValueTerminator) {
          value += next();
        }

        if (next() !== maybeValueTerminator) {
          throw new Error(
            `Unterminated attribute with name "${name}" at position ${pos - 1}`,
          );
        }
      } else {
        while (hasNext() && isUnquotedAttrValueChar(peek())) {
          value += next();
        }
      }
    }

    return { name, value };
  };

  const readElement = (): NodeToken => {
    skip(); // <
    let name = '';

    while (hasNext() && isTagNameChar(peek())) {
      name += next();
    }

    if (!hasNext()) {
      throw new Error(
        `Unterminated opening tag with name "${name}" at position ${pos}`,
      );
    }

    const nameTerminator = next();

    if (
      !isWhitespace(nameTerminator.charCodeAt(0)) &&
      !isOpeningTagTerminator(nameTerminator)
    ) {
      throw new Error(
        `Unexpected terminator "${nameTerminator}" for tag with name "${name}" at position ${pos - 1}`,
      );
    }

    let tagTerminator: string;
    const attributes: AttrToken[] = [];

    if (isOpeningTagTerminator(nameTerminator)) {
      tagTerminator = nameTerminator;
    } else {
      skipWhitespace();

      while (hasNext() && isAlpha(peek().charCodeAt(0))) {
        attributes.push(readAttribute());
        skipWhitespace();
      }

      tagTerminator = next();
    }

    const isSelfClosing = tagTerminator === '/';

    if (tagTerminator !== '>' && !(isSelfClosing && next() === '>')) {
      throw new Error(
        `Unexpected terminator "${tagTerminator}" for tag with name "${name}" at position ${pos - 1}`,
      );
    }

    let children: NodeToken[];

    if (isSelfClosing) {
      children = [];
    } else {
      children = readNodes(name);
    }

    return { type: 'element', name, attributes, children };
  };

  const readComment = (): NodeToken => {
    let content = '';

    skip(2); // <!

    if (!hasNext() || next() !== '-' || next() !== '-') {
      throw new Error(`Unexpected bogus comment at position ${pos}`);
    }

    while (hasNext() && (peek() !== '-' || peekAhead(1) !== '-')) {
      content += next();
    }

    if (!hasNext() || next() !== '-' || next() !== '-') {
      throw new Error(`Unexpected terminator for comment at position ${pos}`);
    }

    const tagTerminator = next();

    if (tagTerminator !== '>') {
      throw new Error(
        `Unexpected terminator "${tagTerminator}" for comment at position ${pos - 1}`,
      );
    }

    return { type: 'comment', content };
  };

  const closeElement = (tagName: string) => {
    skip(2); // </
    let name = '';

    while (hasNext() && isTagNameChar(peek())) {
      name += next();
    }

    if (name !== tagName) {
      throw new Error(
        `Unexpected closing tag name "${name}" for tag with name "${tagName}" at position ${pos - name.length}`,
      );
    }

    skipWhitespace();

    const tagTerminator = next();

    if (tagTerminator !== '>') {
      throw new Error(
        `Unexpected terminator "${tagTerminator}" for closing tag with name "${name}" at position ${pos - 1}`,
      );
    }
  };

  const readNodes = (closingTagName = '') => {
    const nodes: NodeToken[] = [];
    let bufferedText: NodeToken | undefined;

    while (hasNext()) {
      if (peek() === '<') {
        const nextChar = peekAhead(1);

        if (nextChar && isAlpha(nextChar.charCodeAt(0))) {
          if ((bufferedText = flush())) {
            nodes.push(bufferedText);
          }
          nodes.push(readElement());
        } else if (nextChar === '!') {
          if ((bufferedText = flush())) {
            nodes.push(bufferedText);
          }
          nodes.push(readComment());
        } else if (nextChar === '/') {
          if (!closingTagName) {
            throw new Error(`Unexpected closing tag at position ${pos}`);
          }
          if ((bufferedText = flush())) {
            nodes.push(bufferedText);
          }
          closeElement(closingTagName);
          break;
        }
      } else {
        buf += next();
      }
    }

    if ((bufferedText = flush())) {
      nodes.push(bufferedText);
    }

    return nodes;
  };

  return readNodes();
}
