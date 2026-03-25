import { read } from '@sievert/graph';
import { getSource, isSignal } from '@sievert/signals';

export type Params = {
  keys: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expressions: any[];
};

export type Param = {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expression: any;
};

export function shiftUnsafe(params: Params): Param {
  return {
    key: params.keys.shift() as string,
    expression: params.expressions.shift(),
  };
}

export function getCount(params: Params, str: string) {
  let count = 0;

  while (count < params.keys.length && str.includes(params.keys[count])) {
    count++;
  }

  return count;
}

export function shiftMany(params: Params, count: number): Params {
  return {
    keys: params.keys.splice(0, count),
    expressions: params.expressions.splice(0, count),
  };
}

export function replaceAll(params: Params, str: string) {
  for (let i = 0; i < params.keys.length; i++) {
    str = str.replace(params.keys[i], String(params.expressions[i]));
  }

  return str;
}

export function replaceAllSignals(params: Params, str: string) {
  for (let i = 0; i < params.keys.length; i++) {
    const value = params.expressions[i];

    if (isSignal(value)) {
      str = str.replace(params.keys[i], String(read(getSource(value))));
    } else {
      str = str.replace(params.keys[i], String(value));
    }
  }
  return str;
}
