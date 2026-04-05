import { Attribute, CommentNode, ElementNode } from '@sievert/parser';
import { render } from './renderer.js';
import { createContext } from './render-context.js';

describe('renderer', () => {
  describe('elements', () => {
    it('should render element', () => {
      const documentFragment = render([
        { type: 'element', tagName: 'div', attributes: [], children: [] },
      ]);

      expect(documentFragment.childNodes.length).toBe(1);
      expect(documentFragment.childNodes[0]).toBeInstanceOf(HTMLDivElement);
    });

    it('should render element child', () => {
      const documentFragment = render([
        {
          type: 'element',
          tagName: 'section',
          attributes: [],
          children: [
            { type: 'element', tagName: 'p', attributes: [], children: [] },
          ],
        },
      ]);

      const section = documentFragment.childNodes[0];

      expect(section.childNodes.length).toBe(1);
      expect(section.childNodes[0]).toBeInstanceOf(HTMLParagraphElement);
    });

    it('should render text child', () => {
      const documentFragment = render([
        {
          type: 'element',
          tagName: 'span',
          attributes: [],
          children: [{ type: 'text', content: 'test' }],
        },
      ]);

      const span = documentFragment.childNodes[0];

      expect(span.childNodes.length).toBe(1);
      expect(span.childNodes[0]).toBeInstanceOf(Text);
    });

    it('should render comment child', () => {
      const documentFragment = render([
        {
          type: 'element',
          tagName: 'div',
          attributes: [],
          children: [{ type: 'comment', content: 'test' }],
        },
      ]);

      const div = documentFragment.children[0];

      expect(div.childNodes.length).toBe(1);
      expect(div.childNodes[0]).toBeInstanceOf(Comment);
    });

    it('should not render html, head, body, script, noscrip, or style elements', () => {
      const documentFragment = render([
        { type: 'element', tagName: 'html', attributes: [], children: [] },
        { type: 'element', tagName: 'head', attributes: [], children: [] },
        { type: 'element', tagName: 'body', attributes: [], children: [] },
        { type: 'element', tagName: 'script', attributes: [], children: [] },
        { type: 'element', tagName: 'noscript', attributes: [], children: [] },
        { type: 'element', tagName: 'style', attributes: [], children: [] },
      ]);

      expect(documentFragment.childNodes.length).toBe(0);
    });

    it('should add event listener to render context', () => {
      const ctx = createContext();

      render(
        [
          {
            type: 'element',
            tagName: 'button',
            attributes: [{ name: 'onclick', value: 'key' }],
            children: [],
          },
        ],
        ['key'],
        [vi.fn()],
        ctx,
      );

      expect(ctx.eventListeners.size).toBe(1);
    });

    it('should throw on non function event listener', () => {
      const button: ElementNode = {
        type: 'element',
        tagName: 'button',
        attributes: [{ name: 'onclick', value: 'key' }],
        children: [],
      };

      expect(() => render([button], ['key'], ['value'])).toThrow(
        `Unexpected value "value" for eventlistener "onclick" on element "button"`,
      );
    });
  });

  describe('attributes', () => {
    it('should render attributes', () => {
      const documentFragment = render([
        {
          type: 'element',
          tagName: 'div',
          attributes: [{ name: 'test', value: 'test' }],
          children: [],
        },
      ]);

      expect(documentFragment.children[0].getAttribute('test')).toBe('test');
    });

    it('should bind full expression match', () => {
      const documentFragment = render(
        [
          {
            type: 'element',
            tagName: 'div',
            attributes: [{ name: 'test', value: 'key' }],
            children: [],
          },
        ],
        ['key'],
        ['value'],
      );

      expect(documentFragment.children[0].getAttribute('test')).toBe('value');
    });

    it('should throw on partial expression match', () => {
      const attr: Attribute = {
        name: 'test',
        value: 'key test',
      };

      const el: ElementNode = {
        type: 'element',
        tagName: 'div',
        attributes: [attr],
        children: [],
      };

      expect(() => render([el], ['key'], ['value'])).toThrow(
        `Unexpected expression with value "value" in attribute "${attr.name}" for element ${el.tagName}`,
      );
    });

    it('should add sink to render context for dynamic expression', () => {
      const ctx = createContext();

      render(
        [
          {
            type: 'element',
            tagName: 'div',
            attributes: [{ name: 'test', value: 'key' }],
            children: [],
          },
        ],
        ['key'],
        [() => 'value'],
        ctx,
      );

      expect(ctx.sinks.size).toBe(1);
    });

    it('should not add sink to render context for static expression', () => {
      const ctx = createContext();

      render(
        [
          {
            type: 'element',
            tagName: 'div',
            attributes: [{ name: 'test', value: 'key' }],
            children: [],
          },
        ],
        ['key'],
        ['value'],
        ctx,
      );

      expect(ctx.sinks.size).toBe(0);
    });

    it('should not add sink to render context for eventlistener', () => {
      const ctx = createContext();

      render(
        [
          {
            type: 'element',
            tagName: 'button',
            attributes: [{ name: 'onclick', value: 'key' }],
            children: [],
          },
        ],
        ['key'],
        [vi.fn()],
      );

      expect(ctx.sinks.size).toBe(0);
    });
  });

  describe('text', () => {
    it('should render text', () => {
      const documentFragment = render([{ type: 'text', content: 'test' }]);

      expect(documentFragment.childNodes.length).toBe(1);
      expect(documentFragment.childNodes[0]).toBeInstanceOf(Text);
      expect(documentFragment.textContent).toBe('test');
    });

    it('should render static expressions', () => {
      const documentFragment = render(
        [{ type: 'text', content: 'greeting, identifier!' }],
        ['greeting', 'identifier'],
        ['Hello', 'World'],
      );

      expect(documentFragment.textContent).toBe('Hello, World!');
    });

    it('should not add sink to render context for static expression', () => {
      const ctx = createContext();

      render(
        [{ type: 'text', content: 'key' }],
        ['key'],
        ['value'],
        ctx
      );

      expect(ctx.sinks.size).toBe(0);
    });

    it('should not render dynamic expressions', () => {
      const documentFragment = render(
        [{ type: 'text', content: 'greeting, identifier!' }],
        ['greeting', 'identifier'],
        [() => 'Hello', () => 'World'],
      );

      expect(documentFragment.textContent).toBe('');
    });

    it('should add sink to render context for dynamic expressions', () => {
      const ctx = createContext();

      render(
        [{ type: 'text', content: 'key' }],
        ['key'],
        [() => 'value'],
        ctx
      );

      expect(ctx.sinks.size).toBe(1);
    });
  });

  describe('comments', () => {
    it('should render comment', () => {
      const documentFragment = render([
        { type: 'comment', content: 'test' },
      ]);

      expect(documentFragment.childNodes.length).toBe(1);
      expect(documentFragment.childNodes[0]).toBeInstanceOf(Comment);
      expect(documentFragment.childNodes[0].textContent).toBe('test');
    });

    it('should throw on expression matches', () => {
      const comment: CommentNode = {
        type: 'comment',
        content: 'key',
      };

      expect(() => render([comment], ['key'], ['value'])).toThrow(
        `Unexpected expression with value "value" in comment`,
      );
    });
  });
});
