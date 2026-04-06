import { html } from '@sievert/renderer';
import { component } from './component.js';

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
});
