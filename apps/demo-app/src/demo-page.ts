import { component } from '@sievert/component';
import { Counter } from './counter';
import { html } from '@sievert/renderer';
import { signal } from '@sievert/signals';

Counter.define();

export const DemoPage = component({
  name: 'sv-demo-page',
  render: () => {
    const count = signal(0);

    const onCountChange = (event: CustomEvent<number>) => {
      count.set(event.detail);
    };

    return html`
      <h1>Demo Page</h1>
      <sv-counter count=${count} oncountchange=${onCountChange} />
    `;
  },
});
