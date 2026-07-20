import { type Sink, type Source } from './nodes.js';
import { GraphPriority } from './priority.js';
import { SinkMode } from './sink-mode.js';
import { ERROR, INIT, PROGRESS } from './symbols.js';

let autoTick = true;
let currentSink: Sink | null = null;
const nextTick = new Set<Sink>();

function checkStaleSink(sink: Sink) {
  let stale =
    sink.mode === SinkMode.EAGER || (sink.dirty ?? sink.sources.size === 0);

  for (const source of sink.sources) {
    if (sink.sourceVersions.get(source) !== source.version) {
      stale = true;
    }

    if (isSink(source) && checkStaleTransform(source)) {
      stale = true;
    }
  }

  return stale;
}

function checkStaleTransform(transform: Sink & Source): boolean {
  if (!checkStaleSink(transform)) {
    return false;
  }

  detach(transform);
  transform.sources.clear();
  transform.sourceVersions.clear();

  const prevValue = transform.value;
  const prevSink = currentSink;
  currentSink = transform;

  try {
    transform.value = transform.fn();
  } catch (error) {
    transform.value = ERROR;
    panic(error);
  }

  transform.dirty = false;
  currentSink = prevSink;

  if (transform.value === prevValue) {
    return false;
  }

  transform.version++;
  return true;
}

export function tick() {
  if (currentSink) {
    panic(new Error('currentSink is not null before tick(), debug time!'));
  }

  if (nextTick.size === 0) {
    return;
  }

  const prevAutoTick = autoTick;
  autoTick = false;

  while (nextTick.size > 0) {
    const currentTick = [...nextTick].sort(
      (a, b) =>
        (a.priority ?? GraphPriority.DEFAULT) -
        (b.priority ?? GraphPriority.DEFAULT),
    );

    nextTick.clear();

    for (const sink of currentTick) {
      if (!checkStaleSink(sink)) {
        continue;
      }

      detach(sink);
      sink.sources.clear();
      sink.sourceVersions?.clear();
      currentSink = sink;

      try {
        sink.fn();
      } catch (error) {
        panic(error);
      }
    }
  }

  currentSink = null;
  autoTick = prevAutoTick;
}

export async function beforeTick(fn: (() => Promise<void>) | (() => void)) {
  autoTick = false;

  try {
    await fn();
  } catch (error) {
    panic(error);
  }

  tick();
  autoTick = true;
}

export function enqueue(sink: Sink): void {
  nextTick.add(sink);
}

export function detach(sink: Sink) {
  for (const source of sink.sources) {
    source.sinks.delete(sink);

    if (isSink(source) && source.sinks.size === 0) {
      detach(source);
    }
  }

  if (sink.cleanup) {
    sink.cleanup();
  }
}

export function read(source: Source) {
  if (source.value === INIT) {
    if (isSink(source)) {
      initTransform(source);
    } else {
      panic(new Error('Source read before initialization'));
    }
  } else if (source.value === PROGRESS) {
    source.value = ERROR;
    panic(new Error('Infinite loop'));
  } else if (source.value === ERROR) {
    panic(new Error('Graph error'));
  }

  if (autoTick && isSink(source)) {
    checkStaleTransform(source);
  }

  if (currentSink !== null) {
    if (!currentSink.sources.has(source)) {
      currentSink.sources.add(source);
    }

    if (!source.sinks.has(currentSink)) {
      source.sinks.add(currentSink);
    }

    currentSink.sourceVersions.set(source, source.version);
  }

  return source.value;
}

export function update(source: Source, value: unknown): void {
  if (value === source.value) {
    return;
  }

  source.value = value;
  source.version++;
  source.sinks.forEach(notifySink);

  if (autoTick) {
    tick();
  }
}

function notifySink(sink: Sink): void {
  if (sink.dirty === undefined) {
    return enqueue(sink);
  } else if (sink.dirty === true) {
    return;
  }

  sink.dirty = true;

  if (isSource(sink)) {
    sink.sinks.forEach(notifySink);
  }
}

function initTransform(transform: Sink & Source): void {
  const prev = currentSink;
  currentSink = transform;
  transform.value = PROGRESS;

  try {
    transform.value = transform.fn();
    currentSink = prev;
  } catch (error) {
    transform.value = ERROR;
    panic(error);
  }
}

function panic(error: unknown) {
  autoTick = true;
  currentSink = null;
  nextTick.clear();
  throw error;
}

function isSource(obj: object): obj is Source {
  return (
    'value' in obj &&
    'sinks' in obj &&
    obj.sinks instanceof Set &&
    'version' in obj &&
    typeof obj.version === 'number'
  );
}

function isSink(obj: object): obj is Sink {
  return (
    'fn' in obj &&
    typeof obj.fn === 'function' &&
    'sources' in obj &&
    obj.sources instanceof Set &&
    'sourceVersions' in obj &&
    obj.sourceVersions instanceof Map
  );
}
