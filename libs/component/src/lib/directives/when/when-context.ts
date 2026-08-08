import { withScope, type Scope } from '@sievert/di';
import { detach, enqueue, type Source } from '@sievert/graph';
import {
  createContext,
  withContext,
  type HtmlResult,
  type RenderContext,
} from '@sievert/renderer';
import { createSignal, type Signal } from '@sievert/signals';

export type Truthy<T> = Exclude<T, false | 0 | '' | null | undefined>;

export type WhenContext = {
  renderContext: RenderContext;
  nodes: ChildNode[];
};

export function createWhenContext<T>(
  condition: Source,
  render: (value: Signal<Truthy<T>>) => HtmlResult,
  diScope: Scope,
) {
  const result = withScope(diScope, () =>
    withContext(createContext(), () => render(createSignal(condition))),
  );

  if (result.context.inputs.size > 0) {
    throw new Error('input() called outside component context');
  }

  if (result.context.outputs.size > 0) {
    throw new Error('output() called outside component context');
  }

  return {
    renderContext: result.context,
    nodes: [...result.documentFragment.childNodes],
  };
}

export function mount(context: WhenContext, marker: Comment) {
  for (const ref of context.renderContext.eventListeners) {
    ref.element.addEventListener(ref.name, ref.fn);
  }

  for (const sink of context.renderContext.sinks) {
    enqueue(sink);
  }

  marker.after(...context.nodes);
}

export function unmount(context: WhenContext) {
  for (const ref of context.renderContext.eventListeners) {
    ref.element.removeEventListener(ref.name, ref.fn);
  }

  for (const sink of context.renderContext.sinks) {
    detach(sink);
  }

  for (const node of context.nodes) {
    node.remove();
  }
}
