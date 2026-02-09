export function domainRule({ domain, allowedDomains }) {
  return [
    {
      sourceTag: `scope:${domain}`,
      onlyDependOnLibsWithTags: [`scope:${domain}`, `type:public-api`],
    },
    {
      sourceTag: `scope:${domain}`,
      onlyDependOnLibsWithTags: allowedDomains
        .map((scope) => `scope:${scope}`)
        .concat(`scope:${domain}`),
    },
  ];
}
