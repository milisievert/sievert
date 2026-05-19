import { vi } from 'vitest';
import { beforeTick, detach, enqueue, read, tick, update } from './graph.js';
import { createTransform, createSink, createSource } from './nodes.js';

describe('graph', () => {
  describe('tick', () => {
    it('should return false when queue is empty', () => {
      const result = tick();

      expect(result).toBe(false);
    });

    it('should return true when queue is not empty', () => {
      enqueue(createSink(() => 'test'));

      const result = tick();

      expect(result).toBe(true);
    });

    it('should trigger enqueued sink node', () => {
      const sink = createSink(() => 'test');
      const spy = vi.spyOn(sink, 'fn');

      enqueue(sink);
      tick();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should throw on direct infinite update loop', () => {
      const source = createSource('test1');

      const sink = createSink(() => {
        read(source);
        update(source, 'sievert');
      });

      enqueue(sink);

      expect(() => tick()).toThrow('Infinite loop');
    });

    // TODO: sievert #46
    // it('should throw on indirect infinite update loop', () => {
    //   const source1 = createSource('test1');
    //   const source2 = createSource('test2');

    //   enqueue(createSink(() => update(source2, `${read(source1)} sievert`)));
    //   enqueue(createSink(() => update(source1, `${read(source2)} sievert`)));

    //   expect(() => tick()).toThrow('Infinite loop');
    // });
  });

  describe('enqueue', () => {
    it('should skip duplicates', () => {
      const sink = createSink(() => 'test');
      const spy = vi.spyOn(sink, 'fn');

      enqueue(sink);
      enqueue(sink);
      tick();

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('detach', () => {
    it('should detach sink node', () => {
      const source = createSource('test');
      const sink = createSink(() => read(source));

      enqueue(sink);
      tick();
      detach(sink);

      expect(source.sinks.length).toBe(0);
      expect(sink.sources.length).toBe(0);
      expect(sink.sourceVersions?.length).toBeFalsy();
    });

    it('should propagate', () => {
      const source = createSource('test');
      const transform = createTransform(() => read(source));
      const sink = createSink(() => read(transform));

      enqueue(sink);
      tick();
      detach(sink);

      expect(source.sinks.length).toBe(0);
      expect(transform.sources.length).toBe(0);
      expect(transform.sourceVersions?.length).toBeFalsy();
    });
  });

  describe('read', () => {
    it('should throw with circular reference', () => {
      const transform1 = createTransform(() => read(transform2));
      const transform2 = createTransform(() => read(transform1));

      expect(() => read(transform1)).toThrow('Infinite loop');
    });

    it('should initialize transform node and return value', () => {
      const source = createSource('test');
      const transform = createTransform(() => read(source));
      const spy = vi.spyOn(transform, 'fn');

      const result = read(transform);

      expect(result).toBe('test');
      expect(transform.value).toBe('test');
      expect(transform.version).toBe(0);
      expect(spy).toHaveBeenCalledOnce();
    });

    it('should connect nodes', () => {
      const source = createSource('test');
      const transform = createTransform(() => read(source));

      read(transform);

      expect(source.sinks.length).toBe(1);
      expect(source.sinks[0]).toBe(transform);
      expect(transform.sources.length).toBe(1);
      expect(transform.sources[0]).toBe(source);
    });

    it('should connect nodes conditionally', () => {
      const source1 = createSource(true);
      const source2 = createSource('test');

      const sink = createSink(() => {
        if (read(source1)) {
          read(source2);
        }
      });

      enqueue(sink);
      tick();

      expect(sink.sources.length).toBe(2);
      expect(source1.sinks.length).toBe(1);
      expect(source2.sinks.length).toBe(1);

      update(source1, false);

      expect(sink.sources.length).toBe(1);
      expect(source1.sinks.length).toBe(1);
      expect(source2.sinks.length).toBe(0);
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

    // TODO: sievert #46
    // it('should perform chain updates', async () => {
    //   const source1 = createSource('test1');
    //   const source2 = createSource('test2');

    //   const effect1 = vi.fn(() => update(source2, read(source1)));
    //   const effect2 = vi.fn(() => read(source2));

    //   enqueue(createSink(effect1));
    //   enqueue(createSink(effect2));
    //   tick();

    //   expect(effect1).toHaveBeenCalledOnce();
    //   expect(effect2).toHaveBeenCalledOnce();

    //   await beforeTick(() => update(source1, 'sievert'));

    //   expect(source1.value).toBe('sievert');
    //   expect(source2.value).toBe('sievert');
    //   expect(effect1).toHaveBeenCalledTimes(2);
    //   expect(effect2).toHaveBeenCalledTimes(2);
    // });
  });
});
