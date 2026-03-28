import { parse } from './parser.js';
import { SvNode } from './nodes.js';

describe('parser', () => {
  describe('elements', () => {
    it('should parse element', () => {
      const nodes = parse('<test></test>');

      expect(nodes).toEqual<SvNode[]>([
        { type: 'element', tagName: 'test', attributes: [], children: [] },
      ]);
    });

    it('should parse nested elements', () => {
      const nodes = parse('<test><test></test></test>');

      expect(nodes).toEqual<SvNode[]>([
        {
          type: 'element',
          tagName: 'test',
          attributes: [],
          children: [
            { type: 'element', tagName: 'test', attributes: [], children: [] },
          ],
        },
      ]);
    });

    it('should parse void element', () => {
      const nodes = parse('<test />');

      expect(nodes).toEqual<SvNode[]>([
        { type: 'element', tagName: 'test', attributes: [], children: [] },
      ]);
    });

    it('should not expect closing tag for void element', () => {
      expect(() => parse('<test/></test>')).toThrow(
        'Unexpected closing tag at position 7',
      );
    });

    it('should not parse elements following void elements as children', () => {
      const nodes = parse('<test/><test></test>');

      expect(nodes).toEqual<SvNode[]>([
        { type: 'element', tagName: 'test', attributes: [], children: [] },
        { type: 'element', tagName: 'test', attributes: [], children: [] },
      ]);
    });

    it('should not parse text following void elements as children', () => {
      const nodes = parse('<test/>test');

      expect(nodes).toEqual<SvNode[]>([
        { type: 'element', tagName: 'test', attributes: [], children: [] },
        { type: 'text', content: 'test' },
      ]);
    });

    it('should parse names with letters, numbers and hyphens', () => {
      const nodes = parse('<test-123></test-123>');

      expect(nodes).toEqual<SvNode[]>([
        { type: 'element', tagName: 'test-123', attributes: [], children: [] },
      ]);
    });

    it('should throw on unterminated opening tag', () => {
      expect(() => parse('<test')).toThrow(
        'Unterminated opening tag with name "test" at position 5',
      );
    });

    it('should throw on invalid element name', () => {
      expect(() => parse('<test$></test$>')).toThrow(
        `Unexpected terminator "$" for tag with name "test" at position 5`,
      );
    });

    it('should throw on unexpected closing tag', () => {
      expect(() => parse('<test-1></test-2>')).toThrow(
        'Unexpected closing tag name "test-2" for tag with name "test-1" at position 10',
      );
    });

    it('should throw on unterminated closing tag', () => {
      expect(() => parse('<test></test')).toThrow(
        'Unexpected terminator "undefined" for closing tag with name "test" at position 12',
      );
    });
  });

  describe('attributes', () => {
    it('should parse bool attribute', () => {
      const nodes = parse('<test test></test>');

      expect(nodes).toEqual<SvNode[]>([
        {
          type: 'element',
          tagName: 'test',
          attributes: [{ name: 'test', value: '' }],
          children: [],
        },
      ]);
    });

    it('should parse quoted and unquoted attributes', () => {
      const nodes = parse(
        '<test double="value" single=\'value\' none=value></test>',
      );

      expect(nodes).toEqual<SvNode[]>([
        {
          type: 'element',
          tagName: 'test',
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
      expect(() => parse('<test $test></test>')).toThrow(
        'Unexpected terminator "$" for tag with name "test" at position 6',
      );
    });

    it('should throw on unterminated attribute', () => {
      expect(() => parse('<test test="test')).toThrow(
        'Unterminated attribute with name "test" at position 16',
      );
    });

    it('should decode values', () => {
      const nodes = parse('<test test="Tom &amp; Jerry"></test>');

      expect(nodes).toEqual<SvNode[]>([
        {
          type: 'element',
          tagName: 'test',
          attributes: [{ name: 'test', value: 'Tom & Jerry' }],
          children: [],
        },
      ]);
    });
  });

  describe('comments', () => {
    it('should parse comments', () => {
      const nodes = parse('<!--test-->');

      expect(nodes).toEqual<SvNode[]>([
        {
          type: 'comment',
          content: 'test',
        },
      ]);
    });

    it('should throw on bogus comment', () => {
      expect(() => parse('<!test>')).toThrow(
        'Unexpected bogus comment at position 3',
      );
    });

    it('should throw on unterminated comment', () => {
      expect(() => parse('<!--test')).toThrow(
        'Unexpected terminator for comment at position 8',
      );
    });

    it('should decode content', () => {
      const nodes = parse('<!--Ben &amp; Jerry&#39;s-->');

      expect(nodes).toEqual<SvNode[]>([
        {
          type: 'comment',
          content: "Ben & Jerry's",
        },
      ]);
    });
  });

  describe('text', () => {
    it('should parse text', () => {
      const nodes = parse('test');

      expect(nodes).toEqual<SvNode[]>([{ type: 'text', content: 'test' }]);
    });

    it('should flush text buffer before element', () => {
      const nodes = parse('test<test></test>');

      expect(nodes).toEqual<SvNode[]>([
        { type: 'text', content: 'test' },
        { type: 'element', tagName: 'test', attributes: [], children: [] },
      ]);
    });

    it('should flush text buffer before closing element', () => {
      const nodes = parse('<test>test</test>');

      expect(nodes).toEqual<SvNode[]>([
        {
          type: 'element',
          tagName: 'test',
          attributes: [],
          children: [{ type: 'text', content: 'test' }],
        },
      ]);
    });

    it('should flush text buffer before comment', () => {
      const nodes = parse('test<!--test-->');

      expect(nodes).toEqual<SvNode[]>([
        { type: 'text', content: 'test' },
        { type: 'comment', content: 'test' },
      ]);
    });

    it('should decode content', () => {
      const nodes = parse('Benson &amp; Hedges');

      expect(nodes).toEqual<SvNode[]>([
        { type: 'text', content: 'Benson & Hedges' },
      ]);
    });
  });

  it('should parse mixed content', () => {
    const nodes = parse(`
      <div id="test">
        <a href="#">Link</a>
        Hello
        <span>World</span>
        <img alt='test' src=test />
        <!-- comment -->
      </div>
    `);

    expect(nodes).toEqual<SvNode[]>([
      {
        type: 'text',
        content: '\n      ',
      },
      {
        type: 'element',
        tagName: 'div',
        attributes: [{ name: 'id', value: 'test' }],
        children: [
          {
            type: 'text',
            content: '\n        ',
          },
          {
            type: 'element',
            tagName: 'a',
            attributes: [{ name: 'href', value: '#' }],
            children: [{ type: 'text', content: 'Link' }],
          },
          {
            type: 'text',
            content: '\n        Hello\n        ',
          },
          {
            type: 'element',
            tagName: 'span',
            attributes: [],
            children: [{ type: 'text', content: 'World' }],
          },
          {
            type: 'text',
            content: '\n        ',
          },
          {
            type: 'element',
            tagName: 'img',
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
