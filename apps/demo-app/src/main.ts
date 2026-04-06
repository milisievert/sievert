import { DemoPage } from './demo-page';

DemoPage.define();

document
  .querySelector<HTMLDivElement>('#app')!
  .appendChild(document.createElement('sv-demo-page'));
