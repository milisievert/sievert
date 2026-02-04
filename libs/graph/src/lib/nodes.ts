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
};

export const sourceNode = (value: unknown): Source => ({
  value,
  sinks: [],
  version: 0,
});

export const sinkNode = (fn: () => unknown): Sink => ({
  fn,
  sources: [],
});

export const transformNode = (fn: () => unknown): Sink & Source => ({
  fn,
  value: INIT,
  version: 0,
  dirty: false,
  sources: [],
  sourceVersions: [],
  sinks: [],
});
