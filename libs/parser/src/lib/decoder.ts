const entities: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': '\u00A0',
  '&ensp;': '\u2002',
  '&emsp;': '\u2003',
  '&thinsp;': '\u2009',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&iexcl;': '¡',
  '&iquest;': '¿',
  '&cent;': '¢',
  '&pound;': '£',
  '&yen;': '¥',
  '&euro;': '€',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&sect;': '§',
  '&para;': '¶',
  '&deg;': '°',
  '&micro;': 'µ',
  '&bull;': '•',
  '&middot;': '·',
  '&laquo;': '«',
  '&raquo;': '»',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&ne;': '≠',
  '&le;': '≤',
  '&ge;': '≥',
  '&asymp;': '≈',
  '&radic;': '√',
  '&infin;': '∞',
  '&larr;': '←',
  '&rarr;': '→',
  '&uarr;': '↑',
  '&darr;': '↓',
  '&harr;': '↔',
  '&lbrace;': '{',
  '&rbrace;': '}',
  '&lbrack;': '[',
  '&rbrack;': ']',
  '&permil;': '‰',
  '&dagger;': '†',
  '&Dagger;': '‡',
  '&#x2F;': '/',
  '&#x5C;': '\\',
  '&#96;': '`',
};

export function decode(str: string): string {
  return str.replaceAll(/&[a-zA-Z0-9#]+;/g, (entity) => {
    if (entities[entity]) {
      return entities[entity];
    }

    const hexMatch = entity.match(/&#x([0-9a-fA-F]+);/);
    if (hexMatch) {
      try {
        return String.fromCodePoint(parseInt(hexMatch[1], 16));
      } catch {
        return entity;
      }
    }

    const decMatch = entity.match(/&#(\d+);/);
    if (decMatch) {
      try {
        return String.fromCodePoint(parseInt(decMatch[1], 10));
      } catch {
        return entity;
      }
    }

    return entity;
  });
}
