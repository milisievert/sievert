export function createScopeRules({ scope, allowedScopes }) {
  return [
    {
      sourceTag: `scope:${scope}`,
      onlyDependOnLibsWithTags: [`scope:${scope}`, `type:api`],
    },
    {
      sourceTag: `scope:${scope}`,
      onlyDependOnLibsWithTags: allowedScopes
        .map((allowedScope) => `scope:${allowedScope}`)
        .concat(`scope:${scope}`),
    },
  ];
}
