export type ElementNode = {
  type: 'element';
  name: keyof HTMLElementTagNameMap | (string & {});
  attributes: Attribute[];
  children: SvNode[];
};

export type TextNode = {
  type: 'text';
  content: string;
};

export type CommentNode = {
  type: 'comment';
  content: string;
};

export type Attribute = {
  name: string;
  value: string;
};

export type SvNode = CommentNode | TextNode | ElementNode;
