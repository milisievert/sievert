export type EventListenerRef = {
  element: HTMLElement;
  name: string;
  fn: EventListener;
};

export function activate(ref: EventListenerRef) {
  ref.element.addEventListener(ref.name, ref.fn);
}

export function deactivate(ref: EventListenerRef) {
  ref.element.removeEventListener(ref.name, ref.fn);
}
