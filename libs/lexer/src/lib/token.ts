export type Token = AttrToken | ElementToken | TextToken;

export type AttrToken = {
  type: 'attr';
  name: string;
  value: string;
};

export type ElementToken = {
  type: 'element';
  name: keyof HTMLElementTagNameMap | (string & {});
  children: (ElementToken | TextToken)[];
  attributes: AttrToken[];
};

export type TextToken = {
  type: 'text';
  text: string;
};
