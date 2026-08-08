import { createScope, withScope } from '@sievert/di';
import { directive } from '@sievert/directive';
import {
  createSink,
  createSource,
  createTransform,
  detach,
  enqueue,
  read,
  type Source,
} from '@sievert/graph';
import {
  createContext,
  withContext,
  type HtmlResult,
  type RenderContext,
} from '@sievert/renderer';
import {
  createSignal,
  getSource,
  isSignal,
  type Signal,
} from '@sievert/signals';

type EachContext = {
  renderContext: RenderContext;
  nodes: ChildNode[];
  source: Source;
};

type EachOptions<T> = {
  render: (item: Signal<T>) => HtmlResult;
  trackBy: (item: T) => unknown;
};

export const each = directive({
  param: <T>(items: () => T[], options: EachOptions<T>) => ({
    items: isSignal(items) ? getSource(items) : createTransform(items),
    render: options.render,
    trackBy: options.trackBy,
  }),
  handler: ({ items, render, trackBy, marker }) => {
    const diScope = createScope();
    const contexts = new Map<unknown, EachContext>();
    const renderedContexts = new Set<EachContext>();

    return createSink(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemsToRender = read(items) as any[];
      const contextsToRender = new Set<EachContext>();

      for (const item of itemsToRender) {
        const key = trackBy(item);
        let context = contexts.get(key);

        if (!context) {
          const source = createSource(item);

          const result = withScope(diScope, () =>
            withContext(createContext(), () => render(createSignal(source))),
          );

          context = {
            renderContext: result.context,
            nodes: [...result.documentFragment.childNodes],
            source,
          };

          contexts.set(key, context);
        }

        contextsToRender.add(context);
      }

      for (const ctx of renderedContexts.difference(contextsToRender)) {
        unmount(ctx);
      }

      mount([...contextsToRender], marker);

      renderedContexts.clear();

      for (const ctx of contextsToRender) {
        renderedContexts.add(ctx);
      }
    });
  },
});

function mount(contexts: EachContext[], marker: Comment) {
  marker.after(...contexts.flatMap((ctx) => ctx.nodes));

  for (const ctx of contexts) {
    for (const ref of ctx.renderContext.eventListeners) {
      ref.element.addEventListener(ref.name, ref.fn);
    }

    for (const sink of ctx.renderContext.sinks) {
      enqueue(sink);
    }
  }
}

function unmount(context: EachContext) {
  for (const node of context.nodes) {
    node.remove();
  }

  for (const ref of context.renderContext.eventListeners) {
    ref.element.removeEventListener(ref.name, ref.fn);
  }

  for (const sink of context.renderContext.sinks) {
    detach(sink);
  }
}
