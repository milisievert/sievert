import { tick } from '@sievert/graph';
import {
  type HtmlResult,
  activate,
  createContext,
  deactivate,
  getContext,
  withContext,
} from '@sievert/renderer';

type ComponentOptions = {
  name: string;
  render: () => HtmlResult;
};

export type SvComponent = {
  new (): HTMLElement;
  define(): void;
};

export function component(options: ComponentOptions): SvComponent {
  const SvComponentElement = class extends HTMLElement {
    static #isDefined = false;

    #renderContext = getContext();
    #hasOwnContext = this.#renderContext === null;
    #isRendered = false;

    static define() {
      if (this.#isDefined) {
        return;
      }

      if (customElements.get(options.name)) {
        throw new Error(
          `Component with name "${options.name}" is already defined`,
        );
      }

      customElements.define(options.name, SvComponentElement);
    }

    connectedCallback() {
      if (!this.#renderContext) {
        this.#renderContext = createContext();
      }

      if (!this.#isRendered) {
        const result = withContext(this.#renderContext, () => options.render());
        this.appendChild(result.documentFragment);
        this.#isRendered = true;
      }

      if (this.#hasOwnContext) {
        activate(this.#renderContext);
        tick();
      }
    }

    disconnectedCallback() {
      if (this.#hasOwnContext && this.#renderContext) {
        deactivate(this.#renderContext);
      }
    }
  };

  return SvComponentElement as unknown as SvComponent;
}
