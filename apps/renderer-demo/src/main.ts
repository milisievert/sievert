import { html, signal } from "@sievertjs/core";

const root = document.querySelector<HTMLDivElement>('#app')!;

const count = signal(0);

const { documentFragment } = html`
  <div>Hello, World!</div>
  <!-- TODO: throw on expressions in attribute names -->
  <button onclick${() => count.update(x => x + 1)}>
    Clicked: ${count}
  </button>
`;

root.appendChild(documentFragment);