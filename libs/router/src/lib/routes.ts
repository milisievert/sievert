import type { SvComponent } from '@sievertjs/core';

const REST = '__sv_rest__';

export type Route = {
  path: string;
  component?: SvComponent;
  children?: Route[];
  loadComponent?: () => Promise<SvComponent>;
  loadChildren?: () => Promise<Route[]>;
};

export type CompiledRoute = {
  pattern: URLPattern;
  component?: SvComponent;
  children?: CompiledRoute[];
  loadComponent: () => Promise<SvComponent | undefined>;
  loadChildren: () => Promise<CompiledRoute[] | undefined>;
};

export type RouteMatch = {
  route: CompiledRoute;
  params: Record<string, string | undefined>;
};

export function compile(route: Route) {
  const compiled: CompiledRoute = {
    pattern: new URLPattern({ pathname: `/${route.path}/:${REST}*` }),
    component: route.component,
    children: route.children?.map(compile),
    loadComponent: async () => {
      if (!compiled.component) {
        compiled.component = await route.loadComponent?.();
      }
      return compiled.component;
    },
    loadChildren: async () => {
      if (!compiled.children) {
        const children = await route.loadChildren?.();
        compiled.children = children?.map(compile);
      }
      return compiled.children;
    },
  };
  return compiled;
}

// TODO: handle incomplete matches
export async function* match(
  segments: string,
  routes: CompiledRoute[],
): AsyncGenerator<RouteMatch, boolean> {
  for (const route of routes) {
    const result = route.pattern.exec({ pathname: segments });

    if (!result) {
      continue;
    }

    const { [REST]: rest, ...params } = result.pathname.groups;

    yield { route, params };

    if (rest) {
      const children = route.children ?? (await route.loadChildren?.());
      const matched = yield* match(`/${rest}`, children ?? []);

      if (matched) {
        // partial match
        return false;
      }
    }

    // full match
    return true;
  }

  // no match
  return false;
}
