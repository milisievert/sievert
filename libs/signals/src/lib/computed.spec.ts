import { computed } from './computed.js';
import { signal } from './signal.js';

describe('computed', () => {
  it('should return value', () => {
    const com = computed(() => 'test');
    expect(com()).toBe('test');
  });

  it('should read sources', () => {
    const sig = signal('test');
    const com = computed(() => sig() + 'ing');
    expect(com()).toBe('testing');
  });

  it('should update when sources update', () => {
    const sig = signal(true);
    const com = computed(() => (sig() ? 'test' : 'sievert'));
    expect(com()).toBe('test');

    sig.set(false);
    expect(com()).toBe('sievert');
  });
});
