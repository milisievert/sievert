import {
  type Source,
  read,
  sourceNode,
  tick,
  transformNode,
  update,
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

const SIGNAL = Symbol('signal');

export function isSignal(value: unknown): value is Signal<unknown> {
  return typeof value === 'function' && SIGNAL in value;
}

export function getSource(signal: Signal<unknown>): Source {
  return signal[SIGNAL];
}

export function createSignal<T>(fn: () => T) {
  const node = transformNode(fn);

  return Object.defineProperties(() => read(node), {
    [SIGNAL]: {
      value: node,
    },
  }) as Signal<T>;
}

export function createWritableSignal<T>(value: T) {
  const node = sourceNode(value);
  let readOnly: Signal<unknown> | undefined;

  return Object.defineProperties(() => read(node), {
    [SIGNAL]: {
      value: node,
    },
    set: {
      value: (value: T) => {
        updateSignal(node, value);
      },
    },
    update: {
      value: (fn: (value: T) => T) => {
        updateSignal(node, fn(node.value as T));
      },
    },
    readonly: {
      value: () => {
        return (readOnly ??= createSignal(() => read(node)));
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
