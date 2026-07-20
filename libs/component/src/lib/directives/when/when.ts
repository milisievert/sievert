import { directive } from '@sievert/directive';
import { createSink, createTransform, read, SinkMode } from '@sievert/graph';
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

    return createSink(
      () => {
        if (!marker.parentElement) {
          console.log('[when] no parent element for marker, abort sink');
          return;
        }

        if (read(condition)) {
          if (!context) {
            context = createWhenContext(condition, render);
          }

          mount(context, marker);
        } else if (context) {
          unmount(context);
        }
      },
      {
        cleanup: () => {
          if (context) {
            unmount(context);
          }
        },
        mode: SinkMode.EAGER,
      },
    );
  },
});
