import { component } from '@sievert/component';
import { Counter } from './counter';
import { html } from '@sievert/renderer';

Counter.define();

export const DemoPage = component({
  name: 'sv-demo-page',
  render: () => {
    return html`
      <h1>Demo Page</h1>
      <sv-counter />
    `;
  },
});
