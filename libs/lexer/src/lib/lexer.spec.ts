import { tokenize } from './lexer.js';

describe('lexer', () => {
  it('should work', () => {
    expect(tokenize('')).toEqual('');
  });
});
