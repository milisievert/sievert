export type Token = Token.Attr | Token.Element | Token.Text;

// TODO
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Token {
  export type Attr = {
    type: 'attr';
    name: string;
    value: string;
  };

  export type Element = {
    type: 'element';
    name: keyof HTMLElementTagNameMap | (string & {});
    children: (Token.Element | Token.Text)[];
    attributes: Token.Attr[];
  };

  export type Text = {
    type: 'text';
    text: string;
  };
}
