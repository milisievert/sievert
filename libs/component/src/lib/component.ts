import {
  createSink,
  enqueue,
  GraphPriority,
  type Source,
  tick,
  update,
} from '@sievert/graph';
import {
  activate,
  createContext,
  deactivate,
  type HtmlResult,
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
    #inputs = new Map<string, Source>();
    #isInitialized = false;

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
      if (!this.#isInitialized) {
        const result = withContext(this.#renderContext, () => options.render());
        this.appendChild(result.documentFragment);

        enqueue(
          createSink(
            () => {
              for (const [name, ref] of this.#renderContext.inputs) {
                if (ref.required && !this.#inputs.has(name)) {
                  throw new Error(
                    `Missing required input "${name}" for component "${options.name}"`,
                  );
                }
              }
            },
            { priority: GraphPriority.LOW },
          ),
        );

        this.#isInitialized = true;
      }

      activate(this.#renderContext, this);

      if (this.#renderContext.isRoot) {
        tick();
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

      const inputRef = this.#renderContext.inputs.get(qualifiedName);

      if (inputRef) {
        this.#inputs.set(qualifiedName, inputRef.source);
        update(inputRef.source, value);
        return;
      }

      super.setAttribute(qualifiedName, value as string);
    }
  };

  return SvComponent;
}
