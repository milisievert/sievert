import { directive } from '@sievert/directive';
import {
  createSink,
  createTransform,
  GraphPriority,
  read,
} from '@sievert/graph';
import { type HtmlResult } from '@sievert/renderer';
import { getSource, isSignal, type Signal } from '@sievert/signals';
import {
  createWhenContext,
  mount,
  unmount,
  type Truthy,
  type WhenContext,
} from './when-context.js';

export const when = directive({
  param: <T>(
    condition: () => T,
    render: (value: Signal<Truthy<T>>) => HtmlResult,
  ) => ({
    condition: isSignal(condition)
      ? getSource(condition)
      : createTransform(condition),
    render,
  }),
  handler: ({ condition, render, marker }) => {
    let context: WhenContext | undefined;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          if ([...mutation.removedNodes].includes(marker)) {
            if (context) {
              unmount(context);
            }
            observer.disconnect();
          }
        }
      }
    });

    // TODO: handle cleanup when outer sink is detached (should probably look at detach improvements first)
    return createSink(() => {
      if (read(condition)) {
        if (!marker.parentElement) {
          console.log('[when] no parent element for marker, abort sink');
          return;
        }

        if (!context) {
          context = createWhenContext(condition, render);
        }

        mount(context, marker);
        observer.observe(marker.parentElement, { childList: true });
      } else if (context) {
        observer.disconnect();
        unmount(context);
      }
    }, GraphPriority.DEFAULT);
  },
});
