import type { Source, Sink } from './nodes.js';
import { ERROR, INIT, PROGRESS } from './symbols.js';

let context: Sink | null = null;

const nextTick: Sink[] = [];

export function tick(): boolean {
  if (nextTick.length === 0) {
    return false;
  }

  // if (context !== null) ?

  let sink: Sink | undefined;

  while ((sink = nextTick.shift())) {
    detach(sink);
    context = sink;
    sink.fn();
    context = null;
  }

  return true;
}

export function enqueue(sink: Sink): void {
  if (!nextTick.includes(sink)) {
    nextTick.push(sink);
  }
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
    throw new Error('Source read before initialization');
  } else if (source.value === ERROR) {
    throw new Error('Graph error');
  }

  if (context !== null) {
    if (!context.sources.includes(source)) {
      context.sources.push(source);
      context.sourceVersions?.push(source.version);
    } else if (context.sourceVersions) {
      context.sourceVersions[context.sources.indexOf(source)] = source.version;
    }

    if (!source.sinks.includes(context)) {
      source.sinks.push(context);
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
}

function notifySink(sink: Sink): void {
  if (sink.dirty === undefined) {
    if (!nextTick.includes(sink)) {
      nextTick.push(sink);
    }
    return;
  }

  sink.dirty = true;

  // TODO: changed sinks.sources to sinks.sinks, check if correct
  if (isSource(sink) && sink.sinks.length > 0) {
    sink.sinks.forEach(notifySink);
  }
}

function beforeReadTransform(transform: Sink & Source): void {
  if (transform.value === PROGRESS) {
    transform.value = ERROR;
    throw new Error('Infinite loop');
  }

  if (transform.value === ERROR) {
    throw new Error('Graph error');
  }

  if (transform.value === INIT) {
    updateTransform(transform);
  } else if (
    transform.dirty === true ||
    transform.sourceVersions?.some((v, i) => transform.sources[i].version > v)
  ) {
    detach(transform);
    updateTransform(transform);
  }
}

function updateTransform(transform: Sink & Source): void {
  const prev = context;
  context = transform;

  transform.value = PROGRESS;
  transform.value = transform.fn();
  transform.dirty = false;
  transform.version++;

  context = prev;
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
