import { tokenize } from './lexer.js';

describe('lexer', () => {
  it('should work', () => {
    expect(tokenize('').length).toBe(0);
  });
});
