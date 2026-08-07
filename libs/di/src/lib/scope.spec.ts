import { createScope, inject, provide, withScope } from './scope.js';
import { TOKEN, token } from './token.js';

describe('scope', () => {
  describe('provide', () => {
    it('throws when called outside DI scope', () => {
      expect(() => provide(token('test-value'))).toThrow(
        'provide() called outside DI scope',
      );
    });

    it('adds value provider to scope', () => {
      const scope = createScope();
      const TEST_VALUE = token('test-value');
      const factory = () => 'test-value';

      withScope(scope, () => {
        provide(TEST_VALUE, { factory });
      });

      expect(scope.providers.size).toBe(1);
      expect(scope.providers.get(TEST_VALUE[TOKEN])).toEqual(
        expect.objectContaining({ factory }),
      );
    });

    it('adds class provider to scope', () => {
      const scope = createScope();
      const TestClass = class {};

      withScope(scope, () => {
        provide(TestClass);
      });

      expect(scope.providers.size).toBe(1);
      expect(scope.providers.get(TestClass)).toEqual(
        expect.objectContaining({ factory: expect.any(Function) }),
      );
    });

    it('uses singleton lifetime by default', () => {
      const scope = createScope();
      const TEST_VALUE = token('test-value');

      withScope(scope, () => {
        provide(TEST_VALUE);
      });

      expect(scope.providers.get(TEST_VALUE[TOKEN])).toEqual(
        expect.objectContaining({ lifetime: 'singleton' }),
      );
    });

    it('uses requested lifetime', () => {
      const scope = createScope();
      const Singleton = class {};
      const Transient = class {};

      withScope(scope, () => {
        provide(Singleton, { lifetime: 'singleton' });
        provide(Transient, { lifetime: 'transient' });
      });

      expect(scope.providers.get(Singleton)).toEqual(
        expect.objectContaining({ lifetime: 'singleton' }),
      );

      expect(scope.providers.get(Transient)).toEqual(
        expect.objectContaining({ lifetime: 'transient' }),
      );
    });
  });

  describe('inject', () => {
    it('throws when called outside DI scope', () => {
      expect(() => inject(token('test-value'))).toThrow(
        'inject() called outside DI scope',
      );
    });

    it('returns null for optional providers when not found', () => {
      const scope = createScope();
      const TEST_VALUE = token('test-value');

      const result = withScope(scope, () => inject(TEST_VALUE));

      expect(result).toBe(null);
    });

    it('throws for required providers when not found', () => {
      const scope = createScope();
      const TEST_VALUE = token('test-value');

      expect(() =>
        withScope(scope, () => inject(TEST_VALUE, { optional: false })),
      ).toThrow('No provider for test-value');
    });

    it('returns provided value', () => {
      const scope = createScope();
      const TEST_VALUE = token('test-value');

      withScope(scope, () => {
        provide(TEST_VALUE, { factory: () => 'test value' });
      });

      const result = withScope(scope, () => inject(TEST_VALUE));

      expect(result).toBe('test value');
    });

    it('returns provided class', () => {
      const scope = createScope();
      const TestClass = class {};

      withScope(scope, () => {
        provide(TestClass);
      });

      const result = withScope(scope, () => inject(TestClass));

      expect(result).toBeInstanceOf(TestClass);
    });

    it('always returns same reference for singleton providers', () => {
      const scope = createScope();
      const TestClass = class {};

      withScope(scope, () => {
        provide(TestClass, { lifetime: 'singleton' });
      });

      const result1 = withScope(scope, () => inject(TestClass));
      const result2 = withScope(scope, () => inject(TestClass));

      expect(result1).toBe(result2);
    });

    it('always returns new reference for transient providers', () => {
      const scope = createScope();
      const TestClass = class {};

      withScope(scope, () => {
        provide(TestClass, { lifetime: 'transient' });
      });

      const result1 = withScope(scope, () => inject(TestClass));
      const result2 = withScope(scope, () => inject(TestClass));

      expect(result1).not.toBe(result2);
    });
  });
});
