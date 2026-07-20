import { vi } from 'vitest';
import { beforeTick, detach, enqueue, read, tick, update } from './graph.js';
import { createSink, createSource, createTransform } from './nodes.js';
import { GraphPriority } from './priority.js';

describe('graph', () => {
  describe('tick', () => {
    it('triggers enqueued sink node', () => {
      const sink = createSink(() => 'test');
      const spy = vi.spyOn(sink, 'fn');

      enqueue(sink);
      tick();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('follows graph priority', () => {
      const lowPriorityFn = vi.fn();
      const highPriorityFn = vi.fn();
      const defaultPriorityFn = vi.fn();

      enqueue(createSink(lowPriorityFn, { priority: GraphPriority.LOW }));
      enqueue(createSink(highPriorityFn, { priority: GraphPriority.HIGH }));
      enqueue(createSink(defaultPriorityFn));

      tick();

      const lowPriorityOrder = lowPriorityFn.mock.invocationCallOrder[0];
      const highPriorityOrder = highPriorityFn.mock.invocationCallOrder[0];
      const defaultPriorityOrder =
        defaultPriorityFn.mock.invocationCallOrder[0];

      expect(lowPriorityOrder).toBeGreaterThan(highPriorityOrder);
      expect(lowPriorityOrder).toBeGreaterThan(defaultPriorityOrder);
      expect(defaultPriorityOrder).toBeGreaterThan(highPriorityOrder);
    });

    it('aborts and resets graph state on error in sink', () => {
      const throwingFn = vi.fn(() => {
        throw new Error('Error!');
      });

      const abortedFn = vi.fn();

      enqueue(createSink(throwingFn, { priority: GraphPriority.HIGH }));
      enqueue(createSink(abortedFn));

      expect(() => tick()).toThrow('Error!');
      expect(() => tick()).not.toThrow();

      expect(throwingFn).toHaveBeenCalledOnce();
      expect(abortedFn).not.toHaveBeenCalled();
    });

    it('handles chain reactions', () => {
      const source1 = createSource('');
      const source2 = createSource('');
      const source3 = createSource('');

      const sink1 = createSink(() => update(source2, read(source1)));
      const sink2 = createSink(() => update(source3, read(source2)));
      const sink3 = createSink(() => read(source2));

      enqueue(sink1);
      enqueue(sink2);
      enqueue(sink3);

      update(source1, 'sievert');
      tick();

      expect(source1.value).toBe('sievert');
      expect(source2.value).toBe('sievert');
      expect(source3.value).toBe('sievert');
    });
  });

  describe('enqueue', () => {
    it('skips duplicate sink nodes', () => {
      const sink = createSink(() => 'test');
      const spy = vi.spyOn(sink, 'fn');

      enqueue(sink);
      enqueue(sink);
      tick();

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('detach', () => {
    it('detaches sink nodes', () => {
      const source = createSource('test');
      const sink = createSink(() => read(source));

      enqueue(sink);
      tick();
      detach(sink);

      expect(source.sinks.size).toBe(0);
    });

    it('propagates', () => {
      const source = createSource('test');
      const transform = createTransform(() => read(source));
      const sink = createSink(() => read(transform));

      enqueue(sink);
      tick();
      detach(sink);

      expect(source.sinks.size).toBe(0);
      expect(transform.sinks.size).toBe(0);
    });
  });

  describe('read', () => {
    it('throws with circular reference', () => {
      const transform1 = createTransform(() => read(transform2));
      const transform2 = createTransform(() => read(transform1));

      expect(() => read(transform1)).toThrow('Infinite loop');
    });

    it('initializes transform node and return value', () => {
      const source = createSource('test');
      const transform = createTransform(() => read(source));
      const spy = vi.spyOn(transform, 'fn');

      const result = read(transform);

      expect(result).toBe('test');
      expect(transform.value).toBe('test');
      expect(transform.version).toBe(0);
      expect(spy).toHaveBeenCalledOnce();
    });

    it('connects nodes', () => {
      const source = createSource('test');
      const transform = createTransform(() => read(source));

      read(transform);

      expect(source.sinks.size).toBe(1);
      expect(source.sinks.has(transform)).toBe(true);
      expect(transform.sources.size).toBe(1);
      expect(transform.sources.has(source)).toBe(true);
    });

    it('connects nodes conditionally', () => {
      const source1 = createSource(true);
      const source2 = createSource('test');

      const sink = createSink(() => {
        if (read(source1)) {
          read(source2);
        }
      });

      enqueue(sink);
      tick();

      expect(sink.sources.size).toBe(2);
      expect(source1.sinks.size).toBe(1);
      expect(source2.sinks.size).toBe(1);

      update(source1, false);

      expect(sink.sources.size).toBe(1);
      expect(source1.sinks.size).toBe(1);
      expect(source2.sinks.size).toBe(0);
    });

    it('should return updated value', () => {
      const source1 = createSource('hello');
      const source2 = createSource('world');
      const transform = createTransform(
        () => `${read(source1)} ${read(source2)}`,
      );

      const initialValue = read(transform);
      expect(initialValue).toBe('hello world');

      update(source2, 'sievert');

      const updatedValue = read(transform);
      expect(updatedValue).toBe('hello sievert');
    });
  });

  describe('update', () => {
    it('should skip update with strict equal value', () => {
      const source = createSource('test');

      update(source, 'test');

      expect(source.version).toBe(0);
    });

    it('should update value and version', () => {
      const source = createSource('test');

      update(source, 'sievert');

      expect(source.value).toBe('sievert');
      expect(source.version).toBe(1);
    });

    it('should dirty mark dependant transform nodes', () => {
      const source = createSource('test');
      const transform = createTransform(() => read(source));

      read(transform);
      update(source, 'sievert');

      expect(transform.dirty).toBe(true);
    });

    it('should run dependant sink nodes', () => {
      const source = createSource('test');
      const sink = createSink(() => read(source));
      const sinkSpy = vi.spyOn(sink, 'fn');

      enqueue(sink);
      tick();

      update(source, 'sievert');

      expect(sinkSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('beforeTick', () => {
    it('should dirty mark dependant transform nodes on update', async () => {
      const source = createSource('test');
      const transform = createTransform(() => read(source));

      read(transform);

      await beforeTick(() => update(source, 'sievert'));

      expect(transform.dirty).toBe(true);
    });

    it('should run dependant sink nodes on update', async () => {
      const source = createSource('test');
      const sink = createSink(() => read(source));
      const sinkSpy = vi.spyOn(sink, 'fn');

      enqueue(sink);
      tick();

      await beforeTick(() => update(source, 'sievert'));

      expect(sinkSpy).toHaveBeenCalledTimes(2);
    });

    it('should perform bulk updates', async () => {
      const source1 = createSource('test1');
      const source2 = createSource('test2');
      const transform = createTransform(
        () => `${read(source1)} ${read(source2)}`,
      );

      read(transform);

      await beforeTick(() => {
        update(source1, 'sievert');
        update(source2, 'sievert');
      });

      expect(transform.value).toBe('test1 test2');
      expect(transform.version).toBe(0);
      expect(transform.dirty).toBe(true);

      read(transform);

      expect(transform.value).toBe('sievert sievert');
      expect(transform.version).toBe(1);
      expect(transform.dirty).toBe(false);
    });
  });
});
