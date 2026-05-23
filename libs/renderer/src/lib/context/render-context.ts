import { detach, enqueue, type Sink } from '@sievert/graph';
import { type EventListenerRef } from './event-listener-ref.js';
import { initOutputRef, type OutputRef } from './output-ref.js';
import type { InputRef } from './input-ref.js';

export type RenderContext = {
  isRoot: boolean;
  sinks: Set<Sink>;
  eventListeners: Set<EventListenerRef>;
  outputs: Set<OutputRef>;
  inputs: Map<string, InputRef>;
};

let current: RenderContext | null = null;

export function getContext() {
  return current;
}

export const createContext = (): RenderContext => ({
  isRoot: !getContext(),
  sinks: new Set(),
  eventListeners: new Set(),
  outputs: new Set(),
  inputs: new Map(),
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
