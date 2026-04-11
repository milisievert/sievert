import { detach, enqueue, type Sink } from '@sievert/graph';
import { type EventListenerRef } from './event-listener-ref.js';
import { initOutputRef, OutputRef } from './output-ref.js';

export type RenderContext = {
  sinks: Set<Sink>;
  eventListeners: Set<EventListenerRef>;
  outputs: Set<OutputRef>;
};

let current: RenderContext | null = null;

export function getContext() {
  return current;
}

export const createContext = (): RenderContext => ({
  sinks: new Set(),
  eventListeners: new Set(),
  outputs: new Set(),
});

export function withContext<T>(context: RenderContext, fn: () => T) {
  const prev = current;
  current = context;

  try {
    return fn();
  } finally {
    current = prev;
  }
}

export function activate(context: RenderContext, host: HTMLElement) {
  for (const sink of context.sinks) {
    enqueue(sink);
  }

  for (const ref of context.eventListeners) {
    ref.element.addEventListener(ref.name, ref.fn);
  }

  for (const ref of context.outputs) {
    if (!ref.isInitialized) {
      initOutputRef(ref, host);
    }
  }
}

export function deactivate(context: RenderContext) {
  for (const sink of context.sinks) {
    detach(sink);
  }

  for (const ref of context.eventListeners) {
    ref.element.removeEventListener(ref.name, ref.fn);
  }
}
