import { html, HtmlResult } from '@sievert/renderer';
import { component } from './component.js';
import { signal } from '@sievert/signals';
import { input } from './input.js';

function createComponent(render: () => HtmlResult) {
  component({ name: 'test-component', render }).define();
  return document.createElement('test-component');
}

function renderComponent(render: () => HtmlResult) {
  const el = createComponent(render);
  document.documentElement.appendChild(el);
  return el;
}

describe('component', () => {
  beforeEach(() => {
    const win = new Window();

    Object.assign(globalThis, {
      window: win,
      document: win.document,
      customElements: win.customElements,
    });
  });

  it('throws with uninitialized required inputs', () => {
    const el = createComponent(() => {
      const text = input({
        name: 'text',
        required: true,
      });

      return html`${text}`;
    });

    expect(() => document.documentElement.appendChild(el)).toThrow(
      'Missing required input "text" for component "test-component"',
    );
  });

  describe('define', () => {
    it('defines custom element', () => {
      const TestComponent = component({
        name: 'test-component',
        render: () => html``,
      });

      TestComponent.define();

      expect(customElements.get('test-component')).toBe(TestComponent);
    });

    it('throws with duplicate component name', () => {
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

  describe('connectedCallback', () => {
    it('renders template', () => {
      const el = renderComponent(() => html`test`);
      expect(el.textContent).toBe('test');
    });

    it('renders template once', () => {
      const render = vi.fn(() => html`test`);
      const el = renderComponent(render);

      document.documentElement.appendChild(el);
      document.documentElement.removeChild(el);
      document.documentElement.appendChild(el);

      expect(render).toHaveBeenCalledOnce();
    });

    it('activates sinks', () => {
      const text = signal('test');
      const el = createComponent(() => html`${text}`);
      expect(el.textContent).toBe('');

      document.documentElement.appendChild(el);
      expect(el.textContent).toBe('test');

      text.set('sievert');
      expect(el.textContent).toBe('sievert');
    });

    it('reactivates sinks', () => {
      const text = signal('test');
      const el = createComponent(() => html`${text}`);

      document.documentElement.appendChild(el);
      document.documentElement.removeChild(el);

      text.set('sievert');

      document.documentElement.appendChild(el);
      expect(el.textContent).toBe('sievert');

      text.set('test');
      expect(el.textContent).toBe('test');
    });

    it('activates event listeners', () => {
      const fn = vi.fn();
      const el = createComponent(() => html`<button onclick=${fn}></button>`);

      el.firstElementChild?.dispatchEvent(new MouseEvent('click'));
      document.documentElement.appendChild(el);
      el.firstElementChild?.dispatchEvent(new MouseEvent('click'));

      expect(fn).toHaveBeenCalledOnce();
    });

    it('reactivates event listeners', () => {
      const fn = vi.fn();

      const el = renderComponent(() => html`<button onclick=${fn}></button>`);
      document.documentElement.removeChild(el);
      document.documentElement.appendChild(el);

      el.firstElementChild?.dispatchEvent(new MouseEvent('click'));
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe('disconnectedCallback', () => {
    it('deactivates sinks', () => {
      const text = signal('test');

      const el = renderComponent(() => html`${text}`);
      document.documentElement.removeChild(el);

      text.set('sievert');
      expect(el.textContent).toBe('test');
    });

    it('deactivates event listeners', () => {
      const fn = vi.fn();

      const el = renderComponent(() => html`<button onclick=${fn}></button>`);
      document.documentElement.removeChild(el);

      el.firstElementChild?.dispatchEvent(new MouseEvent('click'));
      expect(fn).toHaveBeenCalledTimes(0);
    });
  });

  describe('setAttribute', () => {
    it('updates attributes', () => {
      const el = renderComponent(() => html``);

      el.setAttribute('test', 'sievert');

      expect(el.getAttribute('test')).toBe('sievert');
    });

    it('updates inputs', () => {
      const el = renderComponent(() => {
        const text = input<string>({
          name: 'text',
        });

        return html`${text}`;
      });

      el.setAttribute('text', 'sievert');

      expect(el.textContent).toBe('sievert');
    });

    it('handles complex values', () => {
      const el = renderComponent(() => {
        const person = input<{ name: string; age: number }>({
          name: 'person',
        });

        return html`${() => JSON.stringify(person())}`;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      el.setAttribute('person', { name: 'sievert', age: 0 } as any);

      expect(el.textContent).toBe('{"name":"sievert","age":0}');
    });
  });
});
