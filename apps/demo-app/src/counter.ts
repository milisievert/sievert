import { component, effect } from '@sievert/component';
import { html } from '@sievert/renderer';
import { signal } from '@sievert/signals';

export const Counter = component({
  name: 'sv-counter',
  render: () => {
    const count = signal(0);

    const logCount = effect(() => {
      console.log(`Count updated: ${count()}`);
    });

    return html`
      <div
        style="width: max-content; background: #f0f0f0; border: 1px solid #afafaf; border-radius: 4px; padding: 1rem;"
      >
        <h2>Count: ${count}</h2>
        <button onclick=${() => count.update((x) => x + 1)}>+</button>
        <button onclick=${() => count.update((x) => x - 1)}>-</button>
        <button onclick=${() => count.set(0)}>Reset</button>
      </div>
    `;
  },
});
