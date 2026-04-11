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

    #renderContext = createContext();
    #hasParentContext = !!getContext();
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
      this.#isDefined = true;
    }

    connectedCallback() {
      if (!this.#isRendered) {
        const result = withContext(this.#renderContext, () => options.render());
        this.appendChild(result.documentFragment);
        this.#isRendered = true;
      }

      activate(this.#renderContext, this);

      if (!this.#hasParentContext) {
        tick();
      }
    }

    disconnectedCallback() {
      deactivate(this.#renderContext);
    }
  };

  return SvComponentElement as unknown as SvComponent;
}
