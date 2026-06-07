import { component, match, noMatch, on } from '@sievert/component';
import { html } from '@sievert/renderer';
import { signal } from '@sievert/signals';

export const MatchDemo = component({
  name: 'match-demo',
  render: () => {
    const selectedOption = signal(1);

    const onCheckedChange = (event: Event, value: number) => {
      if ((event.target as HTMLInputElement).checked) {
        selectedOption.set(value);
      }
    };

    return html`
      <fieldset>
        <label for="one">Option 1</label>
        <input
          type="radio"
          name="selectedOption"
          id="one"
          checked
          onchange=${(event: Event) => onCheckedChange(event, 1)}
        />

        <label for="two">Option 2</label>
        <input
          type="radio"
          name="selectedOption"
          id="two"
          onchange=${(event: Event) => onCheckedChange(event, 2)}
        />

        <label for="three">Option 3</label>
        <input
          type="radio"
          name="selectedOption"
          id="three"
          onchange=${(event: Event) => onCheckedChange(event, 3)}
        />
      </fieldset>

      <div>
        <span>Selected option: </span>
        ${match(
          selectedOption,
          on(1, () => html`Option 1`),
          on(2, () => html`Option 2`),
          noMatch(() => html`Invalid option`),
        )}
      </div>
    `;
  },
});
