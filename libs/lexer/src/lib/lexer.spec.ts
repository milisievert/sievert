import type { Token } from './token.js';

import { tokenize } from './lexer.js';

describe('lexer', () => {
  it('should replace `\n` with ` `', () => {
    const tokens = tokenize(`
      <div\nid>Test\n</div>
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [{ type: 'attr', name: 'id', value: '' }],
        children: [{ type: 'text', text: 'Test ' }],
      },
    ]);
  });

  it('should skip unexpected end tags', () => {
    const tokens = tokenize(`
      <div></span>Test</div>
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [],
        children: [{ type: 'text', text: 'Test' }],
      },
    ]);
  });

  it('should treat slashes in start tags as whitespace', () => {
    const tokens = tokenize(`
      <div/ i/d=test></div>
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [
          { type: 'attr', name: 'i', value: '' },
          { type: 'attr', name: 'd', value: 'test' },
        ],
        children: [],
      },
    ]);
  });
});

describe('lexer:void elements', () => {
  it('should not contain children', () => {
    const tokens = tokenize(`
        <br><div></div>
    `);

    expect(tokens).toEqual<Token[]>([
      { type: 'element', name: 'br', attributes: [], children: [] },
      { type: 'element', name: 'div', attributes: [], children: [] },
    ]);
  });

  it('should ignore end tags', () => {
    const tokens = tokenize(`
      <br><div></div></br>
    `);

    expect(tokens).toEqual<Token[]>([
      { type: 'element', name: 'br', attributes: [], children: [] },
      { type: 'element', name: 'div', attributes: [], children: [] },
    ]);
  });
});

describe('lexer:elements', () => {
  it('`<` should break and ignore closing tag', () => {
    const tokens = tokenize(`
      <div></div<>Test
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [],
        children: [{ type: 'text', text: 'Test' }],
      },
    ]);
  });

  it('should tokenize children', () => {
    const tokens = tokenize(`
      <div><span></span></div>
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [],
        children: [
          { type: 'element', name: 'span', attributes: [], children: [] },
        ],
      },
    ]);
  });

  it('should infer missing closing tag', () => {
    const tokens = tokenize(`
      <div><span></span>
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [],
        children: [
          { type: 'element', name: 'span', attributes: [], children: [] },
        ],
      },
    ]);
  });
});

describe('lexer:attributes', () => {
  it('should tokenize', () => {
    const tokens = tokenize(`
      <div id="test-id" class='test-class' data-flag=false></div>
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [
          { type: 'attr', name: 'id', value: 'test-id' },
          { type: 'attr', name: 'class', value: 'test-class' },
          { type: 'attr', name: 'data-flag', value: 'false' },
        ],
        children: [],
      },
    ]);
  });

  it('with quotes should keep whitespace', () => {
    const tokens = tokenize(`
      <div id=' test-id ' class=" test-class "></div>
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [
          { type: 'attr', name: 'id', value: ' test-id ' },
          { type: 'attr', name: 'class', value: ' test-class ' },
        ],
        children: [],
      },
    ]);
  });

  it('without quotes should trim whitespace', () => {
    const tokens = tokenize(`
      <div id= test-id ></div>
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [{ type: 'attr', name: 'id', value: 'test-id' }],
        children: [],
      },
    ]);
  });

  it('should ignore unexpected whitespace', () => {
    const tokens = tokenize(`
      <div \nid = \n "test-id" ></div>
    `);

    expect(tokens).toEqual<Token[]>([
      {
        type: 'element',
        name: 'div',
        attributes: [{ type: 'attr', name: 'id', value: 'test-id' }],
        children: [],
      },
    ]);
  });
});
