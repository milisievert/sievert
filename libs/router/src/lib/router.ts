/*
 * walkthrough of Navigation API (slightly outdated, use mdn for ref): https://www.youtube.com/watch?v=2z2HMwAIc0o
 * rely on native apis like <a href="..."> and navigation for consumer side.
 * no custom state handling, no wrappers
 * only abstract away the routing interception (config, matching, ...)
 *
 * might even be an option to not abstract away interception, as the api is quite good
 * - route-matching and route-rendering apis might be enough
 * - might be a bad idea; look into interfaces for event listeners (navigate, navigatesuccess, navigateerror)
 *
 * NavigateEvent
 *
 * info: transitional data, only during navigation
 * getState: persisted route data
 * navigationType
 * - push: new entry (typically a new route, but not necessarily)
 * - replace: replace current entry (typically same route with new state, but not necessarily)
 * - reload: user triggered page reload, or call to reload()
 * - traverse: user triggered or programmatic traversal of entries (back/forward)
 * skip interception for event.downloadRequest, event.formData, and !event.canIntercept
 * - idea: formData might be intercepted for form posts
 * - idea: prompt guards
 *
 * - note: cross domain navigation fails event.canIntercept check. Spamming
 *
 * NavigationInterceptOptions
 *
 * preCommitHandler: runs before any entries are pushed or replaced
 * - requires cancellable event (don't know what decides if a event is cancellable or not)
 * - can append post commit handlers
 *
 * signal: use event.signal.throwIfAborted() to avoid conflicts with other handlers
 *
 * other navigation events
 * - navigatesuccess: navigation handler was resolved
 * - navigateerror: navigation handler was rejected
 *
 * navigation.transition
 * - .finished: Promise of the current navigation interception
 * - .from: previous entry (if any)
 * - .navigationTyp: type of current navigation event
 *
 * NavigationHistoryEntry
 * id: the id of the immutable entry object
 * key: the key to the entry in the navigation history
 * - on replace events, the id will change, but the key will stay the same
 *
 * navigation.traverseTo(entry.key)
 * - idea: multi-part forms can utilize navigation api to keep form state.
 *   - form data changes -> replace nav entry with new state
 *   - next/prev step -> push new/traverse to entry
 *   - state is kept inside the navigation history
 *
 * navigation.canGoForward/.canGoBack to guard programmatic traversal
 *
 * traversal functions like traveseTo, forward, back are promise based (await .finished)
 *
 * URL Pattern API: https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
 * for path matching
 */

// import { compile, match, type Route } from './routes.js';

// type RouterOptions = {
//   routes: Route[];
// };

// export function useRouting(options: RouterOptions) {
//   const routes = options.routes.map(compile);
//   let outlet = document.createElement('sv-outlet');

//   navigation.addEventListener('navigate', (event) => {
//     if (event.canIntercept) {
//       event.intercept({
//         handler: async () => {
//           for await (const { route } of match(event.destination.url, routes)) {
//             if ((route.component ??= await route.loadComponent?.())) {
//               // TODO: render components
//             }
//           }
//         },
//       });
//     }
//   });

//   document.documentElement.appendChild(outlet);
// }
