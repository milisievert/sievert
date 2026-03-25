import { Params } from './params.js';
import { render } from './renderer.js';

const emptyParams = (): Params => ({
  keys: [],
  expressions: [],
});

describe('renderer', () => {
  it('should return empty result with empty input', () => {
    const result = render({
      tokens: [],
      params: emptyParams(),
    });

    expect(result.documentFragment.children.length).toBe(0);
    expect(result.sinks.length).toBe(0);
  });

  it('should render elements', () => {
    const result = render({
      tokens: [{ type: 'element', name: 'div', attributes: [], children: [] }],
      params: emptyParams(),
    });

    expect(result.documentFragment.children.length).toBe(1);
    expect(result.documentFragment.children[0]).toBeInstanceOf(HTMLDivElement);
  });

  it('should render attributes', () => {
    const result = render({
      tokens: [
        {
          type: 'element',
          name: 'div',
          attributes: [{ name: 'test', value: 'sievert' }],
          children: [],
        },
      ],
      params: emptyParams(),
    });

    const div = result.documentFragment.children[0];
    expect(div.getAttribute('test')).toBe('sievert');
  });

  it('should render text', () => {
    const result = render({
      tokens: [
        {
          type: 'element',
          name: 'div',
          attributes: [],
          children: [{ type: 'text', content: 'test' }],
        },
      ],
      params: emptyParams(),
    });

    const div = result.documentFragment.children[0];
    expect(div.childNodes.length).toBe(1);
    expect(div.childNodes[0].textContent).toBe('test');
  });

  it('should ignore unused params', () => {
    const result = render({
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

    const result = render({
      tokens: [
        {
          type: 'element',
          name: 'div',
          attributes: [],
          children: [{ type: 'text', content: 'key' }],
        },
      ],
      params,
    });

    expect(params.keys.length).toBe(0);
    expect(params.expressions.length).toBe(0);
    expect(result.sinks.length).toBe(0);
  });

  it('should render event listeners', () => {
    const cb = vi.fn();

    const result = render({
      tokens: [
        {
          type: 'element',
          name: 'button',
          attributes: [{ name: 'onclick', value: 'key' }],
          children: [],
        },
      ],
      params: {
        keys: ['key'],
        expressions: [cb],
      },
    });

    const button = result.documentFragment.children[0];
    expect(cb).not.toHaveBeenCalled();

    button.dispatchEvent(new PointerEvent('click'));
    expect(cb).toHaveBeenCalledOnce();
  });
});
