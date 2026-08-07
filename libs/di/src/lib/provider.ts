import type { Lifetime } from './lifetime.js';

export type Provider = {
  lifetime: Lifetime;
  value?: unknown;
  factory: () => unknown;
};
