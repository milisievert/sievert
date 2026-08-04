import { compile, CompiledRoute, match, RouteMatch } from './routes.js';

describe('compile', () => {
  it('creates URLPattern with absolute pathname', () => {
    const route = compile({ path: 'foo' });
    const result = route.pattern.test({ pathname: '/foo' });

    expect(result).toBe(true);
  });

  it('creates URLPattern with partial matching', () => {
    const route = compile({ path: 'foo' });
    const result = route.pattern.test({ pathname: '/foo/bar' });

    expect(result).toBe(true);
  });

  it('creates URLPattern with capturing of remainding unmatched segments', () => {
    const route = compile({ path: 'foo' });
    const result = route.pattern.exec({ pathname: '/foo/bar' });

    expect(result?.pathname.groups).toEqual({ __sv_rest__: 'bar' });
  });

  it('creates component loader', async () => {
    const route = compile({
      path: 'foo',
      loadComponent: () => Promise.resolve('dummy value') as Promise<any>,
    });

    const result = await route.loadComponent();

    expect(result).toBe('dummy value');
  });

  it('creates component loader with caching', async () => {
    const loadComponent = vi.fn(
      () => Promise.resolve('dummy value') as Promise<any>,
    );

    const route = compile({
      path: 'foo',
      loadComponent,
    });

    await route.loadComponent();
    await route.loadComponent();

    expect(route.component).toBe('dummy value');
    expect(loadComponent).toHaveBeenCalledOnce();
  });

  it('creates children loader', async () => {
    const route = compile({
      path: 'foo',
      loadChildren: () => Promise.resolve([{ path: 'bar' }]),
    });

    const result = await route.loadChildren();

    expect(result).toEqual<CompiledRoute[]>([
      {
        pattern: expect.any(URLPattern),
        loadChildren: expect.any(Function),
        loadComponent: expect.any(Function),
      },
    ]);
  });

  it('creates children loader with caching', async () => {
    const loadChildren = vi.fn(() => Promise.resolve([{ path: 'bar' }]));

    const route = compile({
      path: 'foo',
      loadChildren,
    });

    await route.loadChildren();
    await route.loadChildren();

    expect(route.children).toEqual<CompiledRoute[]>([
      {
        pattern: expect.any(URLPattern),
        loadChildren: expect.any(Function),
        loadComponent: expect.any(Function),
      },
    ]);

    expect(loadChildren).toHaveBeenCalledOnce();
  });

  it('creates loaders with no return value when no loaders are provided', async () => {
    const route = compile({ path: 'foo' });

    const component = await route.loadComponent();
    const children = await route.loadChildren();

    expect(component).toBeUndefined();
    expect(children).toBeUndefined();
  });
});

describe('match', () => {
  it('yields matched routes', async () => {
    const route = compile({ path: 'foo' });
    const iterator = match('/foo', [route]);

    const result = await iterator.next();
    const end = await iterator.next();

    expect(result.value).toEqual<RouteMatch>({ route, params: {} });
    expect(end.done).toBe(true);
  });

  it('yields no result with no match', async () => {
    const route = compile({ path: 'bar' });
    const iterator = match('/foo', [route]);

    const end = await iterator.next();

    expect(end.done).toBe(true);
  });

  it('returns true for full match', async () => {
    const route = compile({ path: 'foo' });
    const iterator = match('/foo', [route]);

    await iterator.next();
    const end = await iterator.next();

    expect(end.done).toBe(true);
    expect(end.value).toBe(true);
  });

  it('returns false for no match', async () => {
    const route = compile({ path: 'bar' });
    const iterator = match('/foo', [route]);

    const end = await iterator.next();

    expect(end.done).toBe(true);
    expect(end.value).toBe(false);
  });

  it('yields nested routes', async () => {
    const route = compile({
      path: 'foo',
      children: [
        {
          path: 'bar',
          children: [{ path: 'baz' }],
        },
      ],
    });

    const iterator = match('/foo/bar/baz', [route]);

    const result1 = await iterator.next();
    const result2 = await iterator.next();
    const result3 = await iterator.next();
    const end = await iterator.next();

    expect(result1.value).toEqual<RouteMatch>({
      route: route,
      params: {},
    });

    expect(result2.value).toEqual<RouteMatch>({
      route: route.children?.[0] as CompiledRoute,
      params: {},
    });

    expect(result3.value).toEqual<RouteMatch>({
      route: route.children?.[0].children?.[0] as CompiledRoute,
      params: {},
    });

    expect(end.done).toBe(true);
  });

  it('prioritizes routes by order', async () => {
    const route1 = compile({
      path: 'foo',
      children: [{ path: 'bar' }, { path: '*' }],
    });

    const route2 = compile({ path: '*' });

    const iterator1 = match('/foo/bar', [route1, route2]);
    const iterator2 = match('/foo/bar', [route2, route1]);

    const iterator1Result1 = await iterator1.next();
    const iterator1Result2 = await iterator1.next();
    const iterator1End = await iterator1.next();

    const iterator2Result1 = await iterator2.next();
    const iterator2End = await iterator2.next();

    expect(iterator1Result1.value).toEqual<RouteMatch>({
      route: route1,
      params: {},
    });

    expect(iterator1Result2.value).toEqual<RouteMatch>({
      route: route1.children?.[0] as CompiledRoute,
      params: {},
    });

    expect(iterator1End.done).toBe(true);

    expect(iterator2Result1.value).toEqual<RouteMatch>({
      route: route2,
      params: { 0: 'foo/bar' },
    });

    expect(iterator2End.done).toBe(true);
  });
});
