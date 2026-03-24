export type AttrToken = {
  name: string;
  value: string;
};

export type NodeToken = TextToken | ElementToken | CommentToken;

export type TextToken = {
  type: 'text';
  content: string;
};

export type ElementToken = {
  type: 'element';
  name: keyof HTMLElementTagNameMap | (string & {});
  attributes: AttrToken[];
  children: NodeToken[];
};

export type CommentToken = {
  type: 'comment';
  content: string;
};
