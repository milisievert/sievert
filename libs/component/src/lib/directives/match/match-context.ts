import { detach, enqueue } from '@sievert/graph';
import {
  createContext,
  withContext,
  type HtmlResult,
  type RenderContext,
} from '@sievert/renderer';

export type MatchContext = {
  renderContext: RenderContext;
  nodes: ChildNode[];
};

export function createMatchContext(render: () => HtmlResult) {
  const result = withContext(createContext(), render);

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

export function mount(context: MatchContext, marker: Comment) {
  for (const ref of context.renderContext.eventListeners) {
    ref.element.addEventListener(ref.name, ref.fn);
  }

  for (const sink of context.renderContext.sinks) {
    enqueue(sink);
  }

  marker.after(...context.nodes);
}

export function unmount(context: MatchContext) {
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
