import { signal } from './signal.js';

describe('signal', () => {
  it('should return value', () => {
    const sig = signal('test');
    expect(sig()).toBe('test');
  });
});

describe('signal:set', () => {
  it('should update value', () => {
    const sig = signal('test');

    sig.set('sievert');

    expect(sig()).toBe('sievert');
  });
});

describe('signal:update', () => {
  it('should update value', () => {
    const sig = signal('test');

    sig.update((value) => value + 'ing');

    expect(sig()).toBe('testing');
  });
});
