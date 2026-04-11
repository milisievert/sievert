import { html } from '@sievert/renderer';
import { component } from './component.js';
import { output } from './output.js';

describe('output', () => {
  beforeEach(() => {
    const win = new Window();

    Object.assign(globalThis, {
      window: win,
      document: win.document,
      customElements: win.customElements,
    });
  });

  it('throws when called outside component context', () => {
    expect(() => output('test')).toThrow(
      'output("test") called outside component context',
    );
  });

  it('throws when dispatched before initialization', () => {
    const TestComponent = component({
      name: 'test-component',
      render: () => {
        const test = output('test');
        test();
        return html``;
      },
    });

    TestComponent.define();
    const element = document.createElement('test-component');

    expect(() => document.documentElement.appendChild(element)).toThrow(
      'Dispatcher for output "test" called before initialization',
    );
  });

  it('dispatches custom events with detail', () => {
    const fn = vi.fn();

    const TestComponent = component({
      name: 'test-component',
      render: () => {
        const test = output<string>('test');
        return html`<button onclick=${() => test('button clicked')}></button>`;
      },
    });

    TestComponent.define();

    const element = document.createElement('test-component');
    element.addEventListener('test', fn);
    document.documentElement.appendChild(element);

    element.firstElementChild?.dispatchEvent(new MouseEvent('click'));

    expect(fn).toHaveBeenCalledExactlyOnceWith(expect.any(CustomEvent));
    expect(fn).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ detail: 'button clicked' }),
    );
  });
});
