import { createSink, GraphPriority } from '@sievert/graph';
import { directive, isDirective } from './directive.js';

describe('directive', () => {
  describe('isDirective', () => {
    it('returns true for directives', () => {
      const dir = directive({
        param: () => ({}),
        handler: () => createSink(() => ({}), GraphPriority.DEFAULT),
      });

      expect(isDirective(dir())).toBe(true);
    });

    it('returns false for non directive', () => {
      expect(isDirective({ test: 'sievert' })).toBe(false);
    });
  });
});
