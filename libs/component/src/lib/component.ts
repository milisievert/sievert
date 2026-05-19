import { afterNextTick, type Source, tick, update } from '@sievert/graph';
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
  const SvComponent = class extends HTMLElement {
    static #isDefined = false;

    #renderContext = createContext();
    #hasParentContext = !!getContext();
    #isRendered = false;
    #inputs = new Map<string, Source>();

    static define() {
      if (this.#isDefined) {
        return;
      }

      if (customElements.get(options.name)) {
        throw new Error(
          `Component with name "${options.name}" is already defined`,
        );
      }

      customElements.define(options.name, SvComponent);
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
      } else {
        afterNextTick(() => {
          for (const [name, ref] of this.#renderContext.inputs) {
            if (ref.required && !this.#inputs.has(name)) {
              throw new Error(
                `Missing required input "${name}" for component "${options.name}"`,
              );
            }
          }
        });
      }
    }

    disconnectedCallback() {
      deactivate(this.#renderContext);
    }

    override setAttribute(qualifiedName: string, value: unknown): void {
      const source = this.#inputs.get(qualifiedName);

      if (source) {
        update(source, value);
        return;
      }

      const ref = this.#renderContext.inputs.get(qualifiedName);

      if (ref) {
        this.#inputs.set(qualifiedName, ref.source);
        update(ref.source, value);
        return;
      }

      super.setAttribute(qualifiedName, value as string);
    }
  };

  return SvComponent;
}
