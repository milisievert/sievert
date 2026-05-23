import type { GraphPriority } from './priority.js';
import { INIT } from './symbols.js';

export type Source = {
  value: unknown;
  sinks: Sink[];
  version: number;
};

export type Sink = {
  fn: () => unknown;
  sources: Source[];
  sourceVersions?: number[];
  dirty?: boolean;
  priority?: GraphPriority;
};

export const createSource = (value: unknown): Source => ({
  value,
  sinks: [],
  version: 0,
});

export const createSink = (
  fn: () => unknown,
  priority: GraphPriority,
): Sink => ({
  fn,
  priority,
  sources: [],
});

export const createTransform = (fn: () => unknown): Sink & Source => ({
  fn,
  value: INIT,
  version: 0,
  dirty: false,
  sources: [],
  sourceVersions: [],
  sinks: [],
});
