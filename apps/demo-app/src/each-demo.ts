import { component, each } from '@sievert/component';
import { html } from '@sievert/renderer';
import { signal } from '@sievert/signals';

type Item = {
  name: string;
};

export const EachDemo = component({
  name: 'each-demo',
  render: () => {
    const items = signal<Item[]>([]);
    let nextKey = 0;

    const addItem = () => {
      items.update((value) => [...value, { name: `${nextKey++}` }]);
    };

    const removeItem = () => {
      items.update((value) => {
        const [_first, ...rest] = value;
        return rest;
      });
    };

    return html`
      <h2>Items</h2>

      <button onclick=${addItem}>+</button>
      <button onclick=${removeItem}>-</button>

      ${each(items, {
        trackBy: (item) => item.name,
        render: (item) => html`<div>Item: ${() => item().name}</div>`,
      })}
    `;
  },
});
