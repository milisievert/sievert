import { useScope, type Scope } from '@sievert/di';
import { detach, enqueue } from '@sievert/graph';
import {
  createContext,
  useContext,
  type HtmlResult,
  type RenderContext,
} from '@sievert/renderer';

export type MatchContext = {
  renderContext: RenderContext;
  nodes: ChildNode[];
};

export function createMatchContext(render: () => HtmlResult, diScope: Scope) {
  const renderContext = createContext();

  using _ = useScope(diScope);
  using __ = useContext(renderContext);

  const { documentFragment } = render();

  if (renderContext.inputs.size > 0) {
    throw new Error('input() called outside component context');
  }

  if (renderContext.outputs.size > 0) {
    throw new Error('output() called outside component context');
  }

  return {
    renderContext,
    nodes: [...documentFragment.childNodes],
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
