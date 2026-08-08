import { component, effect, input, output } from '@sievert/component';
import { inject } from '@sievert/di';
import { html } from '@sievert/renderer';
import { ConsoleLogger } from './logger';

export const Counter = component({
  name: 'sv-counter',
  render: () => {
    const logger = inject(ConsoleLogger);

    const count = input<number>({
      name: 'count',
      required: true,
    });

    const countChange = output<number>({
      name: 'countchange',
    });

    effect(() => {
      console.log(`Count updated: ${count()}`);
    });

    logger.log('hello from counter');

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
