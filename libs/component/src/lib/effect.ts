import {
  beforeTick,
  createSink,
  detach,
  enqueue,
  GraphPriority,
  tick,
} from '@sievert/graph';
import { getContext } from '@sievert/renderer';

type EffectOptions = {
  track?: boolean;
};

export type EffectRef = {
  destroy: () => void;
};

export function effect(fn: () => void, options?: EffectOptions): EffectRef {
  const context = getContext();

  if (options?.track !== false && context === null) {
    throw new Error(
      'effect() called outside of component context. If this was intentional, disable the track option.',
    );
  }

  const node = createSink(() => beforeTick(fn), GraphPriority.LOW);

  if (options?.track !== false) {
    context?.sinks.add(node);
  } else {
    enqueue(node);
    tick();
  }

  return {
    destroy: () => detach(node),
  };
}
