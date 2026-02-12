import { Params } from './params.js';
import { parse } from './parser.js';

const emptyParams = (): Params => ({
  keys: [],
  expressions: [],
});

describe('parser', () => {
  it('should return empty result with empty input', () => {
    const result = parse({
      tokens: [],
      params: emptyParams(),
    });

    expect(result.documentFragment.children.length).toBe(0);
    expect(result.sinks.length).toBe(0);
  });

  it('should parse elements', () => {
    const result = parse({
      tokens: [{ type: 'element', name: 'div', attributes: [], children: [] }],
      params: emptyParams(),
    });

    expect(result.documentFragment.children.length).toBe(1);
    expect(result.documentFragment.children[0]).toBeInstanceOf(HTMLDivElement);
  });

  it('should parse attributes', () => {
    const result = parse({
      tokens: [
        {
          type: 'element',
          name: 'div',
          attributes: [{ type: 'attr', name: 'test', value: 'sievert' }],
          children: [],
        },
      ],
      params: emptyParams(),
    });

    const div = result.documentFragment.children[0];
    expect(div.getAttribute('test')).toBe('sievert');
  });

  it('should parse text', () => {
    const result = parse({
      tokens: [
        {
          type: 'element',
          name: 'div',
          attributes: [],
          children: [{ type: 'text', text: 'test' }],
        },
      ],
      params: emptyParams(),
    });

    const div = result.documentFragment.children[0];
    expect(div.children.length).toBe(1);
    expect(div.children[0].textContent).toBe('text');
  });

  it('should ignore unused params', () => {
    const result = parse({
      tokens: [],
      params: {
        keys: ['key'],
        expressions: ['test'],
      },
    });

    expect(result.documentFragment.children.length).toBe(0);
    expect(result.sinks.length).toBe(0);
  });

  it('should take param matches', () => {
    const params = {
      keys: ['key'],
      expressions: ['value'],
    };

    const result = parse({
      tokens: [
        {
          type: 'element',
          name: 'div',
          attributes: [],
          children: [{ type: 'text', text: 'key' }],
        },
      ],
      params,
    });

    expect(params.keys.length).toBe(0);
    expect(params.expressions.length).toBe(0);
    expect(result.sinks.length).toBe(1);
  });

  it('should parse event listeners', () => {
    const cb = () => {};
    const spy = vi.spyOn({ cb }, 'cb');

    const result = parse({
      tokens: [
        {
          type: 'element',
          name: 'button',
          attributes: [{ type: 'attr', name: 'onclick', value: 'key' }],
          children: [],
        },
      ],
      params: {
        keys: ['key'],
        expressions: [cb],
      },
    });

    const div = result.documentFragment.children[0];
    expect(spy).not.toHaveBeenCalled();

    div.dispatchEvent(new PointerEvent('click'));
    expect(spy).toHaveBeenCalledOnce();
  });
});
