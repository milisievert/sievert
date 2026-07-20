export type SinkMode = (typeof SinkMode)[keyof typeof SinkMode];

export const SinkMode = {
  /**
   * Skip running sink when none of the tracked sources are dirty or stale
   */
  DEFAULT: 0,
  /**
   * Always run sink when enqueued, even when no tracked sources has changed
   */
  EAGER: 1,
} as const;
