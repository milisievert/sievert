import { isSignal, signal } from './signals.js';

describe('signals: isSignal', () => {
  it('should return true for signal values', () => {
    const sig = signal('');

    const result = isSignal(sig);

    expect(result).toBe(true);
  });

  it('should return false for non-signal values', () => {
    const result = isSignal('not signal');

    expect(result).toBe(false);
  });
});
