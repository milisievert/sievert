import { component, effect, input, output } from '@sievert/component';
import { html } from '@sievert/renderer';

export const Counter = component({
  name: 'sv-counter',
  render: () => {
    const count = input<number>('count', { required: true });
    const countChange = output<number>('countchange');

    effect(() => {
      console.log(`Count updated: ${count()}`);
    });

    return html`
      <div
        style="width: max-content; background: #f0f0f0; border: 1px solid #afafaf; border-radius: 4px; padding: 1rem;"
      >
        <h2>Count: ${count}</h2>
        <button onclick=${() => countChange(count() + 1)}>+</button>
        <button onclick=${() => countChange(count() - 1)}>-</button>
        <button onclick=${() => countChange(0)}>Reset</button>
      </div>
    `;
  },
});
