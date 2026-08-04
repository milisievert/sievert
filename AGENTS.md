# Sievert workspace architecture (for agents and LLMs)

This repository is an Nx + TypeScript monorepo with a **layered internal/public architecture**.

## 1) Project taxonomy

| Location | Purpose | Tag pattern | Publish intent | Build strategy |
| --- | --- | --- | --- | --- |
| `libs/*` | Smallest internal building blocks | `type:internal` + `scope:*` | Private/internal | `tsc --build` (no bundling) |
| `packages/*` | Public API wrappers (thin re-export packages) | `type:api` + `scope:*` | Publishable npm packages | `@nx/esbuild:esbuild` + d.ts emit |
| `apps/*` | Executables/demos | `type:app` or `scope:all` | Not publishable as packages | App-specific |

Current scopes:
- `scope:core`
- `scope:app` (newly introduced)

Nothing is published yet, but `packages/*` are the intended publish surface.

## 2) Dependency rules (enforced by ESLint module boundaries)

Rules are implemented in:
- `eslint.config.mjs`
- `tools/create-scope-rules.mjs`

### Intentional dependency model
1. Same-scope internal libraries may depend on each other directly.
2. Cross-scope internal-to-internal imports are **not allowed**.
3. Cross-scope access must go through `type:api` packages.
4. `packages/*` are thin wrappers around internal libs and expose the public API.

### Practical interpretation
- `scope:app` internals may consume `scope:core` APIs (`type:api`), but not `scope:core` internals.
- `scope:core` code cannot reach into `scope:app`.

## 3) TypeScript/build contract

### Internal libs (`libs/*`)
- Built by TypeScript project references.
- `emitDeclarationOnly` is explicitly set to `false` in each lib `tsconfig.lib.json`, so libs emit JS + `.d.ts`.
- These outputs are primarily for workspace composition and local graph builds.

### API packages (`packages/*`)
- JS output is bundled by esbuild.
- Type declarations are emitted from TypeScript (`emitDeclarationOnly: true`).
- For publishable wrappers, declaration maps should be disabled unless source files are shipped.

## 4) Core package declaration-map decision

`packages/core` uses `files: ["dist"]`, so source files are not included in package contents.
Because of that, `declarationMap` must be `false` for `packages/core` to avoid publishing `.d.ts.map` files that point to non-shipped sources.

## 5) How to add new projects safely

### New internal lib in a scope
1. Put it in `libs/<name>`.
2. Tag it as `["scope:<scope>", "type:internal"]`.
3. Keep dependencies same-scope by default.
4. If cross-scope access is needed, use a `type:api` package as the boundary.

### New public package
1. Put it in `packages/<name>`.
2. Tag it as `["scope:<scope>", "type:api"]`.
3. Keep it thin: re-export API from internal libs.
4. Use esbuild for JS output and TS for declaration emit.

## 6) Architectural guardrails

1. Keep `libs/*` granular and composable (small building blocks).
2. Keep `packages/*` as stable API boundaries, not implementation hubs.
3. Do not bypass scope boundaries with direct internal cross-scope dependencies.
4. Treat module-boundary tags (`scope:*`, `type:*`) as the source of truth for allowed imports.
