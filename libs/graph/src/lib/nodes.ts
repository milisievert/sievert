import { GraphPriority } from './priority.js';
import { SinkMode } from './sink-mode.js';
import { INIT } from './symbols.js';

export type Source = {
  value: unknown;
  sinks: Set<Sink>;
  version: number;
  equal?: (a: unknown, b: unknown) => boolean;
};

export type Sink = {
  fn: () => unknown;
  sources: Set<Source>;
  sourceVersions: Map<Source, number>;
  dirty?: boolean;
  priority?: GraphPriority;
  mode?: SinkMode;
  cleanup?: () => void;
};

export type SinkOptions = {
  priority?: GraphPriority;
  mode?: SinkMode;
  cleanup?: () => void;
};

export const createSource = (value: unknown): Source => ({
  value,
  sinks: new Set(),
  version: 0,
});

export const createSink = (fn: () => unknown, options?: SinkOptions): Sink => ({
  fn,
  sources: new Set(),
  sourceVersions: new Map(),
  priority: options?.priority ?? GraphPriority.DEFAULT,
  mode: options?.mode ?? SinkMode.DEFAULT,
  cleanup: options?.cleanup,
});

export const createTransform = (fn: () => unknown): Sink & Source => ({
  fn,
  value: INIT,
  version: 0,
  dirty: false,
  sources: new Set(),
  sourceVersions: new Map(),
  sinks: new Set(),
});
