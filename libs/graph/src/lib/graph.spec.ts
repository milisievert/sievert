import { vi } from 'vitest';
import { detach, enqueue, read, tick, update } from './graph.js';
import { transformNode, sinkNode, sourceNode } from './nodes.js';

describe('graph:tick', () => {
  it('should return false when queue is empty', () => {
    const result = tick();

    expect(result).toBe(false);
  });

  it('should return true when queue is not empty', () => {
    enqueue(sinkNode(() => 'test'));

    const result = tick();

    expect(result).toBe(true);
  });

  it('should trigger enqueued subscribers', () => {
    const sink = sinkNode(() => 'test');
    const spy = vi.spyOn(sink, 'fn');

    enqueue(sink);
    tick();

    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('graph:enqueue', () => {
  it('should skip duplicates', () => {
    const sink = sinkNode(() => 'test');
    const spy = vi.spyOn(sink, 'fn');

    enqueue(sink);
    enqueue(sink);
    tick();

    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('graph:detach', () => {
  it('should detach subscriber', () => {
    const source = sourceNode('test');
    const sink = sinkNode(() => read(source));

    enqueue(sink);
    tick();
    detach(sink);

    expect(source.sinks.length).toBe(0);
    expect(sink.sources.length).toBe(0);
    expect(sink.sourceVersions?.length).toBeFalsy();
  });

  it('should propagate up graph', () => {
    const source = sourceNode('test');
    const transform = transformNode(() => read(source));
    const sink = sinkNode(() => read(transform));

    enqueue(sink);
    tick();
    detach(sink);

    expect(source.sinks.length).toBe(0);
    expect(transform.sources.length).toBe(0);
    expect(transform.sourceVersions?.length).toBeFalsy();
  });
});

describe('graph:read', () => {
  it('should throw with circular reference', () => {
    const transform1 = transformNode(() => read(transform2));
    const transform2 = transformNode(() => read(transform1));

    expect(() => read(transform1)).toThrow('Infinite loop');
  });

  it('should initialize transform and return value', () => {
    const source = sourceNode('test');
    const transform = transformNode(() => read(source));
    const spy = vi.spyOn(transform, 'fn');

    const result = read(transform);

    expect(result).toBe('test');
    expect(transform.value).toBe('test');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should connect nodes', () => {
    const source = sourceNode('test');
    const transform = transformNode(() => read(source));

    read(transform);

    expect(source.sinks.length).toBe(1);
    expect(source.sinks[0]).toBe(transform);
    expect(transform.sources.length).toBe(1);
    expect(transform.sources[0]).toBe(source);
  });

  it('should connect nodes conditionally', () => {
    const source1 = sourceNode(true);
    const source2 = sourceNode('test');

    const sink = sinkNode(() => {
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
    tick();

    expect(sink.sources.length).toBe(1);
    expect(source1.sinks.length).toBe(1);
    expect(source2.sinks.length).toBe(0);
  });

  it('should return updated value', () => {
    const source1 = sourceNode('hello');
    const source2 = sourceNode('world');
    const transform = transformNode(() => `${read(source1)} ${read(source2)}`);

    const initialValue = read(transform);
    expect(initialValue).toBe('hello world');

    update(source2, 'sievert');

    const updatedValue = read(transform);
    expect(updatedValue).toBe('hello sievert');
  });
});

describe('graph:update', () => {
  it('should skip update with strict equal value', () => {
    const source = sourceNode('test');

    update(source, 'test');

    expect(source.version).toBe(0);
  });

  it('should update value and version', () => {
    const source = sourceNode('test');

    update(source, 'sievert');

    expect(source.value).toBe('sievert');
    expect(source.version).toBe(1);
  });

  it('should dirty mark transforms and enqueue sinks', () => {
    const source = sourceNode('test');
    const transform = transformNode(() => read(source));
    const sink = sinkNode(() => read(transform));

    const transformSpy = vi.spyOn(transform, 'fn');
    const sinkSpy = vi.spyOn(sink, 'fn');

    enqueue(sink);
    tick();

    expect(transformSpy).toHaveBeenCalledOnce();
    expect(sinkSpy).toHaveBeenCalledOnce();

    update(source, 'sievert');

    expect(transform.dirty).toBe(true);

    tick();

    expect(transformSpy).toHaveBeenCalledTimes(2);
    expect(sinkSpy).toHaveBeenCalledTimes(2);
  });
});
