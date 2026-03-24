import { tokenize } from './lexer.js';
import { NodeToken } from './tokens.js';

describe('lexer', () => {
  describe('elements', () => {
    it('should parse element', () => {
      const tokens = tokenize('<test></test>');

      expect(tokens).toEqual<NodeToken[]>([
        { type: 'element', name: 'test', attributes: [], children: [] },
      ]);
    });

    it('should parse nested elements', () => {
      const tokens = tokenize('<test><test></test></test>');

      expect(tokens).toEqual<NodeToken[]>([
        {
          type: 'element',
          name: 'test',
          attributes: [],
          children: [
            { type: 'element', name: 'test', attributes: [], children: [] },
          ],
        },
      ]);
    });

    it('should parse void element', () => {
      const tokens = tokenize('<test />');

      expect(tokens).toEqual<NodeToken[]>([
        { type: 'element', name: 'test', attributes: [], children: [] },
      ]);
    });

    it('should not expect closing tag for void element', () => {
      expect(() => tokenize('<test/></test>')).toThrow(
        'Unexpected closing tag at position 7',
      );
    });

    it('should not parse elements following void elements as children', () => {
      const tokens = tokenize('<test/><test></test>');

      expect(tokens).toEqual<NodeToken[]>([
        { type: 'element', name: 'test', attributes: [], children: [] },
        { type: 'element', name: 'test', attributes: [], children: [] },
      ]);
    });

    it('should not parse text following void elements as children', () => {
      const tokens = tokenize('<test/>test');

      expect(tokens).toEqual<NodeToken[]>([
        { type: 'element', name: 'test', attributes: [], children: [] },
        { type: 'text', content: 'test' },
      ]);
    });

    it('should parse names with letters, numbers and hyphens', () => {
      const tokens = tokenize('<test-123></test-123>');

      expect(tokens).toEqual<NodeToken[]>([
        { type: 'element', name: 'test-123', attributes: [], children: [] },
      ]);
    });

    it('should throw on unterminated opening tag', () => {
      expect(() => tokenize('<test')).toThrow(
        'Unterminated opening tag with name "test" at position 5',
      );
    });

    it('should throw on invalid element name', () => {
      expect(() => tokenize('<test$></test$>')).toThrow(
        `Unexpected terminator "$" for tag with name "test" at position 5`,
      );
    });

    it('should throw on unexpected closing tag', () => {
      expect(() => tokenize('<test-1></test-2>')).toThrow(
        'Unexpected closing tag name "test-2" for tag with name "test-1" at position 10',
      );
    });

    it('should throw on unterminated closing tag', () => {
      expect(() => tokenize('<test></test')).toThrow(
        'Unexpected terminator "undefined" for closing tag with name "test" at position 12',
      );
    });
  });

  describe('attributes', () => {
    it('should parse bool attribute', () => {
      const tokens = tokenize('<test test></test>');

      expect(tokens).toEqual<NodeToken[]>([
        {
          type: 'element',
          name: 'test',
          attributes: [{ name: 'test', value: '' }],
          children: [],
        },
      ]);
    });

    it('should parse quoted and unquoted attributes', () => {
      const tokens = tokenize(
        '<test double="value" single=\'value\' none=value></test>',
      );

      expect(tokens).toEqual<NodeToken[]>([
        {
          type: 'element',
          name: 'test',
          attributes: [
            { name: 'double', value: 'value' },
            { name: 'single', value: 'value' },
            { name: 'none', value: 'value' },
          ],
          children: [],
        },
      ]);
    });

    it('should throw on invalid attribute name', () => {
      expect(() => tokenize('<test $test></test>')).toThrow(
        'Unexpected terminator "$" for tag with name "test" at position 6',
      );
    });

    it('should throw on unterminated attribute', () => {
      expect(() => tokenize('<test test="test')).toThrow(
        'Unterminated attribute with name "test" at position 16',
      );
    });
  });

  describe('comments', () => {
    it('should parse comments', () => {
      const tokens = tokenize('<!--test-->');

      expect(tokens).toEqual<NodeToken[]>([
        {
          type: 'comment',
          content: 'test',
        },
      ]);
    });

    it('should throw on bogus comment', () => {
      expect(() => tokenize('<!test>')).toThrow(
        'Unexpected bogus comment at position 3',
      );
    });

    it('should throw on unterminated comment', () => {
      expect(() => tokenize('<!--test')).toThrow(
        'Unexpected terminator for comment at position 8',
      );
    });
  });

  describe('text', () => {
    it('should parse text', () => {
      const tokens = tokenize('test');

      expect(tokens).toEqual<NodeToken[]>([{ type: 'text', content: 'test' }]);
    });

    it('should flush text buffer before element', () => {
      const tokens = tokenize('test<test></test>');

      expect(tokens).toEqual<NodeToken[]>([
        { type: 'text', content: 'test' },
        { type: 'element', name: 'test', attributes: [], children: [] },
      ]);
    });

    it('should flush text buffer before closing element', () => {
      const tokens = tokenize('<test>test</test>');

      expect(tokens).toEqual<NodeToken[]>([
        {
          type: 'element',
          name: 'test',
          attributes: [],
          children: [{ type: 'text', content: 'test' }],
        },
      ]);
    });

    it('should flush text buffer before comment', () => {
      const tokens = tokenize('test<!--test-->');

      expect(tokens).toEqual<NodeToken[]>([
        { type: 'text', content: 'test' },
        { type: 'comment', content: 'test' },
      ]);
    });
  });

  it('should parse mixed content', () => {
    const tokens = tokenize(`
      <div id="test">
        <a href="#">Link</a>
        Hello
        <span>World</span>
        <img alt='test' src=test />
        <!-- comment -->
      </div>
    `);

    expect(tokens).toEqual<NodeToken[]>([
      {
        type: 'text',
        content: '\n      ',
      },
      {
        type: 'element',
        name: 'div',
        attributes: [{ name: 'id', value: 'test' }],
        children: [
          {
            type: 'text',
            content: '\n        ',
          },
          {
            type: 'element',
            name: 'a',
            attributes: [{ name: 'href', value: '#' }],
            children: [{ type: 'text', content: 'Link' }],
          },
          {
            type: 'text',
            content: '\n        Hello\n        ',
          },
          {
            type: 'element',
            name: 'span',
            attributes: [],
            children: [{ type: 'text', content: 'World' }],
          },
          {
            type: 'text',
            content: '\n        ',
          },
          {
            type: 'element',
            name: 'img',
            attributes: [
              { name: 'alt', value: 'test' },
              { name: 'src', value: 'test' },
            ],
            children: [],
          },
          {
            type: 'text',
            content: '\n        ',
          },
          {
            type: 'comment',
            content: ' comment ',
          },
          {
            type: 'text',
            content: '\n      ',
          },
        ],
      },
      {
        type: 'text',
        content: '\n    ',
      },
    ]);
  });
});
