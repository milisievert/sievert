export type OutputRef = {
  name: string;
  isInitialized: boolean;
  dispatcher: (detail: unknown) => void;
  eventInitDict: Omit<CustomEventInit<unknown>, 'detail'>;
};

export const createOutputRef = (
  name: string,
  eventInitDict: Omit<CustomEventInit<unknown>, 'detail'>,
): OutputRef => ({
  name,
  eventInitDict,
  isInitialized: false,
  dispatcher: () => {
    throw new Error(
      `Dispatcher for output "${name}" called before initialization`,
    );
  },
});

export function initOutputRef(ref: OutputRef, host: HTMLElement) {
  ref.dispatcher = (detail: unknown) => {
    host.dispatchEvent(
      new CustomEvent(ref.name, { ...ref.eventInitDict, detail }),
    );
  };
  ref.isInitialized = true;
}
