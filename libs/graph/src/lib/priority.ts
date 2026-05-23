export type GraphPriority = (typeof GraphPriority)[keyof typeof GraphPriority];

export const GraphPriority = {
  HIGH: 0,
  DEFAULT: 1,
  LOW: 2,
} as const;
