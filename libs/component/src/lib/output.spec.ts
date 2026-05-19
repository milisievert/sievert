import { activate, createContext, withContext } from '@sievert/renderer';
import { output } from './output.js';

describe('output', () => {
  it('throws when called outside component context', () => {
    expect(() => output({ name: 'test' })).toThrow(
      'output("test") called outside component context',
    );
  });

  it('throws when dispatched before initialization', () => {
    const outputRef = withContext(createContext(), () =>
      output({ name: 'test' }),
    );

    expect(() => outputRef()).toThrow(
      'Dispatcher for output "test" called before initialization',
    );
  });

  it('dispatches custom events with detail', () => {
    const ctx = createContext();
    const host = document.createElement('div');
    const outputRef = withContext(ctx, () => output<string>({ name: 'test' }));

    activate(ctx, host);

    const fn = vi.fn();
    host.addEventListener('test', fn);
    outputRef('sievert');

    expect(fn).toHaveBeenCalledExactlyOnceWith(expect.any(CustomEvent));
    expect(fn).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ detail: 'sievert' }),
    );
  });
});
