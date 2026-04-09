import { html } from '@sievert/renderer';
import { component } from './component.js';
import { signal } from '@sievert/signals';

describe('component', () => {
  beforeEach(() => {
    const win = new Window();

    Object.assign(globalThis, {
      window: win,
      document: win.document,
      customElements: win.customElements,
    });
  });

  describe('define', () => {
    it('should define custom element', () => {
      const TestComponent = component({
        name: 'test-component',
        render: () => html``,
      });

      TestComponent.define();

      expect(customElements.get('test-component')).toBe(TestComponent);
    });

    it('should throw on duplicate component name', () => {
      const TestComponent = component({
        name: 'test-component',
        render: () => html``,
      });

      const TestComponent2 = component({
        name: 'test-component',
        render: () => html``,
      });

      TestComponent.define();

      expect(() => TestComponent2.define()).toThrow(
        'Component with name "test-component" is already defined',
      );
    });
  });

  it('should render template when connected', () => {
    const TestComponent = component({
      name: 'test-component',
      render: () => html`test`,
    });

    TestComponent.define();
    const element = document.createElement('test-component');
    document.documentElement.appendChild(element);

    expect(element.textContent).toBe('test');
  });

  it('should not rerender template when reconnected', () => {
    const render = vi.fn(() => html`test`);

    const TestComponent = component({
      name: 'test-component',
      render,
    });

    TestComponent.define();
    const element = document.createElement('test-component');
    document.documentElement.appendChild(element);
    document.documentElement.removeChild(element);
    document.documentElement.appendChild(element);

    expect(render).toHaveBeenCalledOnce();
  });

  it('should activate sinks when connected', () => {
    const text = signal('test');

    const TestComponent = component({
      name: 'test-component',
      render: () => html`${text}`,
    });

    TestComponent.define();

    const element = document.createElement('test-component');
    expect(element.textContent).toBe('');

    document.documentElement.appendChild(element);
    expect(element.textContent).toBe('test');

    text.set('sievert');
    expect(element.textContent).toBe('sievert');
  });

  it('should deactivate sinks when disconnected', () => {
    const text = signal('test');

    const TestComponent = component({
      name: 'test-component',
      render: () => html`${text}`,
    });

    TestComponent.define();
    const element = document.createElement('test-component');
    document.documentElement.appendChild(element);
    document.documentElement.removeChild(element);

    text.set('sievert');
    expect(element.textContent).toBe('test');
  });

  it('should reactivate sinks when reconnected', () => {
    const text = signal('test');

    const TestComponent = component({
      name: 'test-component',
      render: () => html`${text}`,
    });

    TestComponent.define();
    const element = document.createElement('test-component');
    document.documentElement.appendChild(element);
    document.documentElement.removeChild(element);
    text.set('sievert');

    document.documentElement.appendChild(element);
    expect(element.textContent).toBe('sievert');

    text.set('test');
    expect(element.textContent).toBe('test');
  });

  it('should activate event listeners when connected', () => {
    const fn = vi.fn();

    const TestComponent = component({
      name: 'test-component',
      render: () => html`<button onclick=${fn}></button>`,
    });

    TestComponent.define();
    const element = document.createElement('test-component');
    document.documentElement.appendChild(element);

    element.firstElementChild?.dispatchEvent(new MouseEvent('click'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should deactivate event listeners when disconnected', () => {
    const fn = vi.fn();

    const TestComponent = component({
      name: 'test-component',
      render: () => html`<button onclick=${fn}></button>`,
    });

    TestComponent.define();
    const element = document.createElement('test-component');
    document.documentElement.appendChild(element);
    document.documentElement.removeChild(element);

    element.firstElementChild?.dispatchEvent(new MouseEvent('click'));
    expect(fn).toHaveBeenCalledTimes(0);
  });

  it('should reactivate event listeners when reconnected', () => {
    const fn = vi.fn();

    const TestComponent = component({
      name: 'test-component',
      render: () => html`<button onclick=${fn}></button>`,
    });

    TestComponent.define();
    const element = document.createElement('test-component');
    document.documentElement.appendChild(element);
    document.documentElement.removeChild(element);
    document.documentElement.appendChild(element);

    element.firstElementChild?.dispatchEvent(new MouseEvent('click'));
    expect(fn).toHaveBeenCalledOnce();
  });
});
