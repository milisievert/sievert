import { type Sink, type Source } from './nodes.js';
import { GraphPriority } from './priority.js';
import { ERROR, INIT, PROGRESS } from './symbols.js';

let autoTick = true;
let currentSink: Sink | null = null;

const nextTick = new Set<Sink>();
const postTick = new Set<() => void>();

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

export function afterNextTick(fn: () => void) {
  postTick.add(fn);
}

export function tick(): boolean {
  if (currentSink) {
    panic(new Error('currentSink is not null before tick(), debug time!'));
  }

  if (nextTick.size === 0) {
    afterTick();
    return false;
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
      detach(sink);
      currentSink = sink;
      try {
        sink.fn();
      } catch (error) {
        panic(error);
      }

      currentSink = null;
    }
  }

  afterTick();
  autoTick = prevAutoTick;

  return true;
}

function afterTick() {
  for (const fn of postTick) {
    try {
      fn();
    } catch (error) {
      panic(error);
    }
  }

  postTick.clear();
}

export function enqueue(sink: Sink): void {
  nextTick.add(sink);
}

export function detach(sink: Sink): void {
  let source: Source | undefined;

  while ((source = sink.sources.pop())) {
    const i = source.sinks.indexOf(sink);

    if (i !== -1) {
      source.sinks.splice(i, 1);

      if (source.sinks.length === 0 && isSink(source)) {
        detach(source);
      }
    }

    sink.sourceVersions?.pop();
  }
}

export function read(source: Source) {
  if (isSink(source)) {
    beforeReadTransform(source);
  } else if (source.value === INIT) {
    source.value = ERROR;
    panic(new Error('Source read before initialization'));
  } else if (source.value === ERROR) {
    panic(new Error('Graph error'));
  }

  if (currentSink !== null) {
    if (!currentSink.sources.includes(source)) {
      currentSink.sources.push(source);
      currentSink.sourceVersions?.push(source.version);
    } else if (currentSink.sourceVersions) {
      currentSink.sourceVersions[currentSink.sources.indexOf(source)] =
        source.version;
    }

    if (!source.sinks.includes(currentSink)) {
      source.sinks.push(currentSink);
    }
  }

  return source.value;
}

export function update(source: Source, value: unknown): void {
  if (value === source.value) {
    return;
  }

  source.value = value;
  source.version++;

  if (source.sinks.length > 0) {
    source.sinks.forEach(notifySink);
  }

  if (autoTick) {
    tick();
  }
}

function notifySink(sink: Sink): void {
  if (sink.dirty === undefined) {
    return enqueue(sink);
  }

  if (sink.dirty === true) {
    return;
  }

  sink.dirty = true;

  if (isSource(sink) && sink.sinks.length > 0) {
    sink.sinks.forEach(notifySink);
  }
}

function beforeReadTransform(transform: Sink & Source): void {
  if (transform.value === PROGRESS) {
    transform.value = ERROR;
    panic(new Error('Infinite loop'));
  }

  if (transform.value === ERROR) {
    panic(new Error('Graph error'));
  }

  if (transform.value === INIT) {
    initTransform(transform);
  } else if (
    transform.dirty === true ||
    transform.sourceVersions?.some((v, i) => transform.sources[i].version > v)
  ) {
    detach(transform);
    updateTransform(transform);
  }
}

function initTransform(transform: Sink & Source): void {
  const prev = currentSink;
  currentSink = transform;

  transform.value = PROGRESS;
  transform.value = transform.fn();

  currentSink = prev;
}

function updateTransform(transform: Sink & Source): void {
  const prev = currentSink;
  currentSink = transform;

  transform.value = PROGRESS;
  transform.value = transform.fn();
  transform.dirty = false;
  transform.version++;

  currentSink = prev;
}

function panic(error: unknown) {
  autoTick = true;
  currentSink = null;
  nextTick.clear();
  postTick.clear();
  throw error;
}

function isSource(obj: object): obj is Source {
  return (
    'value' in obj &&
    'sinks' in obj &&
    Array.isArray(obj.sinks) &&
    'version' in obj &&
    typeof obj.version === 'number'
  );
}

function isSink(obj: object): obj is Sink {
  return (
    'fn' in obj &&
    typeof obj.fn === 'function' &&
    'sources' in obj &&
    Array.isArray(obj.sources)
  );
}
