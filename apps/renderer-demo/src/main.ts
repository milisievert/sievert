import { html } from '@sievert/renderer';
import { signal } from '@sievert/signals';

const root = document.querySelector<HTMLDivElement>('#app')!;

const count = signal(0);

const { documentFragment } = html`
  <div>Hello, World!</div>
  <button onclick=${() => count.update(x => x + 1)}>
    Clicked: ${count}
  </button>
`;

root.appendChild(documentFragment);
