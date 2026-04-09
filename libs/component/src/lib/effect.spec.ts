import { html } from '@sievert/renderer';
import { component } from './component.js';
import { effect } from './effect.js';

describe('effect', () => {
  beforeEach(() => {
    const win = new Window();

    Object.assign(globalThis, {
      window: win,
      document: win.document,
      customElements: win.customElements,
    });
  });

  it('should be triggered after component is connected when called in component context', () => {
    const fn = vi.fn();

    const TestComponent = component({
      name: 'test-component',
      render: () => {
        effect(fn);
        return html``;
      },
    });

    TestComponent.define();

    document.documentElement.appendChild(
      document.createElement('test-component'),
    );

    expect(fn).toHaveBeenCalledOnce();
  });

  it('should be triggered immediately when called outside component context', () => {
    const fn = vi.fn();
    effect(fn, { track: false });

    expect(fn).toHaveBeenCalledOnce();
  });

  it('should throw when called with tracking outside component context', () => {
    expect(() => effect(vi.fn())).toThrow(
      'effect() called outside of component context. If this was intentional, disable the track option.',
    );
  });
});
