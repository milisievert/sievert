import { directive } from '@sievert/directive';
import { createSink, createTransform, read } from '@sievert/graph';
import type { HtmlResult } from '@sievert/renderer';
import { getSource, isSignal } from '@sievert/signals';
import {
  createMatchContext,
  mount,
  unmount,
  type MatchContext,
} from './match-context.js';
import { createScope } from '@sievert/di';

type MatchCase<T> = readonly [T | typeof DEFAULT, () => HtmlResult];

const DEFAULT = Symbol('default');

export const match = directive({
  param: <T>(value: () => T, ...cases: MatchCase<T>[]) => ({
    value: isSignal(value) ? getSource(value) : createTransform(value),
    cases: new Map<unknown, () => HtmlResult>(cases),
  }),
  handler: ({ value, cases, marker }) => {
    const diScope = createScope();
    const contexts = new Map<unknown, MatchContext>();
    let currentContext: MatchContext | undefined;

    return createSink(
      () => {
        const key = read(value);

        if (currentContext) {
          unmount(currentContext);
          currentContext = undefined;
        }

        let render: (() => HtmlResult) | undefined;

        if (contexts.has(key)) {
          currentContext = contexts.get(key);
        } else if ((render = cases.get(key))) {
          currentContext = createMatchContext(render, diScope);
          contexts.set(key, currentContext);
        } else if (contexts.has(DEFAULT)) {
          currentContext = contexts.get(DEFAULT);
        } else if ((render = cases.get(DEFAULT))) {
          currentContext = createMatchContext(render, diScope);
          contexts.set(DEFAULT, currentContext);
        }

        if (currentContext) {
          mount(currentContext, marker);
        }
      },
      {
        cleanup: () => {
          if (currentContext) {
            unmount(currentContext);
            currentContext = undefined;
          }
        },
      },
    );
  },
});

export const on = <T>(value: T, render: () => HtmlResult) =>
  [value, render] as const;

export const noMatch = (render: () => HtmlResult) => [DEFAULT, render] as const;
