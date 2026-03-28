import { decode } from './decoder.js';

describe('decode', () => {
  it('decodes named entities', () => {
    expect(decode('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });

  it('decodes hexadecimal numeric entities', () => {
    expect(decode('Smile: &#x1F600;')).toBe('Smile: 😀');
  });

  it('decodes decimal numeric entities', () => {
    expect(decode('Heart: &#10084;')).toBe('Heart: ❤');
  });

  it('ignores unsupported entities', () => {
    expect(decode('Test &notarealentity; here')).toBe(
      'Test &notarealentity; here',
    );
  });

  it('decodes mixed content', () => {
    expect(decode('5 &lt; 10 &amp;&amp; 10 &gt; 5')).toBe('5 < 10 && 10 > 5');
  });

  it('poops', () => {
    expect(decode('&#x1F4A9;')).toBe('💩');
  });
});
