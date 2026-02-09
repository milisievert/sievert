import { signal } from './signal.js';
import { isSignal } from './signals.js';

describe('signals:isSignal', () => {
  it('should return true for signals', () => {
    const result = isSignal(signal(''));
    expect(result).toBe(true);
  });

  it('should return false for other values', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const result = ['', 0, {}, [], () => {}]
      .map(isSignal)
      .every((value) => value);

    expect(result).toBe(false);
  });
});
