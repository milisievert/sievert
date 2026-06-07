import type { Sink } from '@sievert/graph';

type DirectiveHandler<T> = (param: T & { marker: Comment }) => Sink;

type DirectiveOptions<ParamArgs extends unknown[], Param> = {
  param: (...args: ParamArgs) => Param;
  handler: DirectiveHandler<Param>;
};

export type Directive = {
  [REF]: {
    render: () => {
      sink: Sink;
      marker: Comment;
    };
  };
};

const REF = Symbol('ref');

export function directive<TArgs extends unknown[], TResult>(
  options: DirectiveOptions<TArgs, TResult>,
): (...args: TArgs) => Directive {
  return (...args: TArgs) => {
    const marker = document.createComment('sv-marker');

    return {
      [REF]: {
        render: () => ({
          marker,
          sink: options.handler({
            marker,
            ...options.param(...args),
          }),
        }),
      },
    };
  };
}

export function isDirective(value: unknown): value is Directive {
  return !!value && typeof value === 'object' && REF in value;
}

export function renderDirective(directive: Directive) {
  return directive[REF].render();
}
