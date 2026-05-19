import { createContext, withContext } from '@sievert/renderer';
import { input } from './input.js';

describe('input', () => {
  it('throws when called outside component context', () => {
    expect(() => input('test')).toThrow(
      'input("test") called outside component context',
    );
  });

  it('throws with duplicate names in context', () => {
    expect(() =>
      withContext(createContext(), () => {
        input('test');
        input('test');
      }),
    ).toThrow(`Duplicate input name "test"`);
  });
});
