export { type HtmlResult, html } from './lib/html.js';
export {
  type RenderContext,
  activate,
  createContext,
  deactivate,
  getContext,
  withContext,
} from './lib/context/render-context.js';
export { type OutputRef, createOutputRef } from './lib/context/output-ref.js';
export { type InputRef } from './lib/context/input-ref.js';
