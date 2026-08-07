export type Token<T = unknown> = { readonly [TOKEN]: symbol };

export type DiToken<T = unknown> = Token<T> | (new () => T);

export const TOKEN = Symbol('token');

export const token = <T = unknown>(description: string): Token<T> => ({
  [TOKEN]: Symbol(description),
});

export function getKey(token: DiToken) {
  return TOKEN in token ? token[TOKEN] : token;
}

export function getName(token: DiToken) {
  return TOKEN in token ? token[TOKEN].description : token.name;
}
