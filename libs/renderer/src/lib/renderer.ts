import {
  beforeTick,
  read,
  sinkNode,
  Source,
  transformNode,
} from '@sievert/graph';
import type {
  Attribute,
  CommentNode,
  ElementNode,
  SvNode,
  TextNode,
} from '@sievert/parser';
import { getSource, isSignal } from '@sievert/signals';
import { type RenderContext } from './context/render-context.js';

const tagNameBlackList = [
  'html',
  'head',
  'body',
  'script',
  'noscript',
  'style', // TODO: style handling
];

export function render(
  nodes: SvNode[],
  keys: string[],
  expressions: unknown[],
  context: RenderContext,
) {
  const documentFragment = document.createDocumentFragment();

  let expressionIndex = 0;

  const hasNextExpression = () => expressionIndex < expressions.length;
  const peekKey = () => keys[expressionIndex];
  const nextExpression = () => expressions[expressionIndex++];

  const bindAttribute = (element: HTMLElement, attr: Attribute) => {
    const expression = nextExpression();

    if (typeof expression !== 'function') {
      element.setAttribute(attr.name, expression as string);
      return;
    }

    const sourceNode = isSignal(expression)
      ? getSource(expression)
      : transformNode(expression as () => unknown);

    context.sinks.add(
      sinkNode(() =>
        element.setAttribute(attr.name, read(sourceNode) as string),
      ),
    );
  };

  const bindText = (text: Text, node: TextNode) => {
    let staticContent = node.content;

    const dynamicExpressions: [string, Source][] = [];
    const staticExpressions: [string, unknown][] = [];

    while (staticContent.includes(peekKey())) {
      const key = peekKey();
      const expression = nextExpression();

      if (typeof expression === 'function') {
        const sourceNode = isSignal(expression)
          ? getSource(expression)
          : transformNode(expression as () => unknown);

        dynamicExpressions.push([key, sourceNode]);
      } else {
        staticExpressions.push([key, expression]);
      }
    }

    for (const [key, expression] of staticExpressions) {
      staticContent = staticContent.replace(key, String(expression));
    }

    if (dynamicExpressions.length === 0) {
      text.textContent = staticContent;
      return;
    }

    context.sinks.add(
      sinkNode(() => {
        let dynamicContent = staticContent;

        for (const [key, source] of dynamicExpressions) {
          dynamicContent = dynamicContent.replace(key, String(read(source)));
        }

        text.textContent = dynamicContent;
      }),
    );
  };

  const bindEventListener = (element: HTMLElement, attr: Attribute) => {
    const handler = nextExpression();

    if (typeof handler !== 'function') {
      throw new Error(
        `Unexpected value "${handler}" for eventlistener "${attr.name}" on element "${element.tagName.toLowerCase()}"`,
      );
    }

    context.eventListeners.add({
      element,
      name: attr.name.slice(2),
      fn: async (event) => await beforeTick(() => handler(event)),
    });
  };

  const renderText = (node: TextNode) => {
    const text = document.createTextNode('');

    if (hasNextExpression() && node.content.includes(peekKey())) {
      bindText(text, node);
    } else {
      text.textContent = node.content;
    }

    return text;
  };

  const renderComment = (node: CommentNode) => {
    if (node.content.includes(peekKey())) {
      throw new Error(
        `Unexpected expression with value "${nextExpression()}" in comment`,
      );
    }
    return document.createComment(node.content);
  };

  const renderElement = (node: ElementNode) => {
    const element = document.createElement(node.tagName);

    for (const attr of node.attributes) {
      if (hasNextExpression() && attr.name.includes(peekKey())) {
        throw new Error(
          `Unexpected expression with value "${nextExpression()}" in attribute name for element "${node.tagName}"`,
        );
      }

      if (!hasNextExpression() || !attr.value.includes(peekKey())) {
        element.setAttribute(attr.name, attr.value);
        continue;
      }

      if (attr.value !== peekKey()) {
        throw new Error(
          `Unexpected expression with value "${nextExpression()}" in attribute "${attr.name}" for element "${node.tagName}"`,
        );
      }

      if (attr.name.startsWith('on')) {
        bindEventListener(element, attr);
      } else {
        bindAttribute(element, attr);
      }
    }

    renderNodes(element, node.children);

    return element;
  };

  const renderNodes = (parent: Node, children: SvNode[]) => {
    for (const child of children) {
      if (child.type === 'element') {
        if (tagNameBlackList.includes(child.tagName)) {
          console.warn(`Banned tag name "${child.tagName}" skipped`);
          continue;
        }
        parent.appendChild(renderElement(child));
      } else if (child.type === 'text') {
        parent.appendChild(renderText(child));
      } else if (child.type === 'comment') {
        parent.appendChild(renderComment(child));
      }
    }
  };

  renderNodes(documentFragment, nodes);

  return documentFragment;
}
