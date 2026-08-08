import { Lifetime } from './lifetime.js';
import type { Provider } from './provider.js';
import { getKey, getName, TOKEN, type DiToken } from './token.js';

export type Scope = {
  providers: Map<symbol | (new () => unknown), Provider>;
};

let current: Scope | null = null;

export function createScope() {
  const scope: Scope = {
    providers: new Map(),
  };

  if (current) {
    for (const [key, provider] of current.providers) {
      scope.providers.set(key, provider);
    }
  }

  return scope;
}

export function withScope<T>(scope: Scope, fn: () => T) {
  const prev = current;
  current = scope;
  const result = fn();
  current = prev;
  return result;
}

export function provide<T>(
  token: DiToken<T>,
  options?: { lifetime?: Lifetime; factory?: () => NoInfer<T> },
): void {
  if (!current) {
    throw new Error('provide() called outside DI scope');
  }

  if (TOKEN in token) {
    current.providers.set(token[TOKEN], {
      lifetime: options?.lifetime ?? 'singleton',
      factory: options?.factory || (() => null),
    });
  } else {
    current.providers.set(token, {
      lifetime: options?.lifetime ?? 'singleton',
      factory: () => new token(),
    });
  }
}

export function inject<T>(token: DiToken<T>): T;
export function inject<T>(
  token: DiToken<T>,
  options: { optional: true },
): T | null;
export function inject<T>(token: DiToken<T>, options: { optional: false }): T;
export function inject<T>(
  token: DiToken<T>,
  options?: { optional?: boolean },
): T | null {
  if (!current) {
    throw new Error('inject() called outside DI scope');
  }

  const provider = current.providers.get(getKey(token));

  if (!provider) {
    if (options?.optional === true) {
      return null;
    }
    throw new Error(`No provider for ${getName(token)}`);
  }

  if (provider.lifetime === 'transient') {
    return provider.factory() as T;
  }

  return (provider.value ??= provider.factory()) as T;
}
