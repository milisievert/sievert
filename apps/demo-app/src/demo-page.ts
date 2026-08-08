import { component, when } from '@sievert/component';
import { provide } from '@sievert/di';
import { html } from '@sievert/renderer';
import { signal } from '@sievert/signals';
import { Counter } from './counter';
import { EachDemo } from './each-demo';
import { MatchDemo } from './match-demo';
import { ConsoleLogger } from './logger';

Counter.define();
MatchDemo.define();
EachDemo.define();

export const DemoPage = component({
  name: 'sv-demo-page',
  render: () => {
    provide(ConsoleLogger);

    const count = signal(0);
    const showCounter = signal(true);

    const nestedCount = signal(0);
    const showNestedCounter = signal(true);

    const person = signal<{ name: string; age: number } | null>(null);

    const onCountChange = (event: CustomEvent<number>) => {
      count.set(event.detail);
    };

    return html`
      <h1>Demo Page</h1>

      <match-demo />

      <button onclick=${() => showCounter.update((show) => !show)}>
        Toggle counter
      </button>

      ${when(showCounter, () => {
        return html`
          <sv-counter count=${count} oncountchange=${onCountChange} />

          <button onclick=${() => showNestedCounter.update((show) => !show)}>
            Toggle nested counter
          </button>

          ${when(showNestedCounter, () => {
            return html`<sv-counter
              count=${nestedCount}
              oncountchange=${(event: CustomEvent<number>) =>
                nestedCount.set(event.detail)}
            />`;
          })}
        `;
      })}

      <button
        onclick=${() =>
          person.update((person) =>
            person ? null : { name: 'sivert', age: 30 },
          )}
      >
        Toggle person
      </button>

      ${when(person, (person) => {
        return html`
          <div>Name: ${person().name}</div>
          <div>Age ${person().age}</div>
        `;
      })}

      <each-demo />
    `;
  },
});
