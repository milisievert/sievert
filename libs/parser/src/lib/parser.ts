import type { AttrToken, ElementToken, TextToken } from '@sievert/lexer';
import type { Sink } from '@sievert/graph';
import { read, transformNode } from '@sievert/graph';
import { getSource, isSignal } from '@sievert/signals';
import { decode } from './decoder.js';
import {
  getCount,
  Params,
  replaceAll,
  replaceAllSignals,
  shiftMany,
  shiftUnsafe,
} from './params.js';

type ParserOptions = {
  tokens: (ElementToken | TextToken)[];
  params: Params;
};

export type ParserResult = {
  documentFragment: DocumentFragment;
  sinks: Sink[];
};

/*
 * TODO: ref. chatgpt:Improving template reactivity
 * - generate generic updater functions rather than actual subscibers
 * - this makes the compiled template+updaters cachable
 * - the template should be cloned, and the updaters should be used for constructing the actual subscribers, per instance
 */
// (TODO: handle unexpected params like out of place conditionals)
export function parse({ tokens, params }: ParserOptions): ParserResult {
  const result: ParserResult = {
    documentFragment: document.createDocumentFragment(),
    sinks: [],
  };

  for (const token of tokens) {
    if (token.type === 'element') {
      result.documentFragment.appendChild(
        parseElement(token, params, result.sinks),
      );
    }
    if (token.type === 'text') {
      result.documentFragment.appendChild(
        parseText(token, params, result.sinks),
      );
    }
  }

  return result;
}

function parseElement(
  token: ElementToken,
  params: Params,
  sinks: Sink[],
): Element {
  const element = document.createElement(token.name);

  // TODO: should extract separate method for attribute processing
  for (const attr of token.attributes) {
    if (isEventListener(attr, params)) {
      const { expression } = shiftUnsafe(params);
      element.addEventListener(attr.name.substring(2), expression);
    } else {
      if (attr.value === params.keys[0]) {
        // handle token containing params
        const { expression } = shiftUnsafe(params);

        // handle all functions as reactive reads
        if (typeof expression === 'function') {
          const source = isSignal(expression)
            ? getSource(expression)
            : transformNode(expression);

          sinks.push({
            fn: () => {
              element.setAttribute(attr.name, read(source) as string);
            },
            sources: [],
          });
        } else {
          // handle all non-functions as static values
          element.setAttribute(attr.name, expression);
        }
      } else {
        // handle token not containing params
        element.setAttribute(attr.name, attr.value);
      }
    }
  }

  for (const child of token.children) {
    if (child.type === 'element') {
      element.appendChild(parseElement(child, params, sinks));
    }
    if (child.type === 'text') {
      element.appendChild(parseText(child, params, sinks));
    }
  }

  return element;
}

// TODO: handle all functions as reactive reads
function parseText(token: TextToken, params: Params, sinks: Sink[]): Text {
  const text = document.createTextNode('');
  const content = decode(token.text);

  const takeCount = getCount(params, content);
  const take = shiftMany(params, takeCount);

  /*
   * TODO: need to rethink this part, need to find a scalable and less error prone solution
   * - could split text token based on expressions. Eg. token could contain some text, a contitional, and a signal
   */
  // if (take.expressions.some(isConditional)) {
  // }

  if (take.expressions.some(isSignal)) {
    sinks.push({
      fn: () => (text.textContent = replaceAllSignals(take, content)),
      sources: [],
    });
  } else {
    text.textContent = replaceAll(take, content);
  }

  return text;
}

function isEventListener(token: AttrToken, params: Params) {
  return (
    token.name.startsWith('on') &&
    token.value === params.keys[0] &&
    typeof params.expressions[0] === 'function'
  );
}
