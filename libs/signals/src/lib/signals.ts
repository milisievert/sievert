import {
  type Source,
  type Sink,
  INIT,
  read,
  update,
  tick,
} from '@sievert/graph';

type SignalGetter<T> = () => T;
type SignalSetter<T> = (value: T) => void;
type SignalUpdater<T> = (fn: (value: T) => T) => void;
type SignalConverter<T> = () => Signal<T>;

export type Signal<T> = SignalGetter<T> &
  Readonly<{
    [SIGNAL]: Source;
  }>;

export type WritableSignal<T> = SignalGetter<T> &
  Readonly<{
    [SIGNAL]: Source;
    set: SignalSetter<T>;
    update: SignalUpdater<T>;
    readonly: SignalConverter<T>;
  }>;

export const SIGNAL = Symbol('signal');

export function isSignal(value: unknown): value is Signal<unknown> {
  return typeof value === 'function' && SIGNAL in value;
}

export function getSource(signal: Signal<unknown>): Source {
  return signal[SIGNAL];
}

export function computed<T>(fn: () => T): Signal<T> {
  return createSignal({
    fn: fn,
    value: INIT,
    version: 0,
    dirty: false,
    sinks: [],
    sources: [],
    sourceVersions: [],
  });
}

export function signal<T>(value: T): WritableSignal<T> {
  return createWritableSignal({
    value: value,
    sinks: [],
    version: 0,
  });
}

export function createSignal<T>(source: Source | (Source & Sink)) {
  return Object.defineProperties(() => read(source), {
    [SIGNAL]: {
      value: source,
    },
  }) as Signal<T>;
}

export function createWritableSignal<T>(source: Source) {
  return Object.defineProperties(() => read(source), {
    [SIGNAL]: {
      value: source,
    },
    set: {
      value: (value: T) => {
        updateSignal(source, value);
      },
    },
    update: {
      value: (fn: (value: T) => T) => {
        updateSignal(source, fn(source.value as T));
      },
    },
    readonly: {
      value: () => {
        return createSignal(source);
      },
    },
  }) as WritableSignal<T>;
}

// TODO: in context updates
function updateSignal(source: Source, value: unknown) {
  update(source, value);

  // const context = getContext();
  // if (!context) {
  tick();
  return;
  // }
}
