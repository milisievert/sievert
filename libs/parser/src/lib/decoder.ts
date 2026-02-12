const entities: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": "\u00A0",
  "&copy;": "©",
  "&reg;": "®",
  "&cent;": "¢",
  "&pound;": "£",
  "&yen;": "¥",
  "&euro;": "€",
  "&sect;": "§",
  "&para;": "¶",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&lsquo;": "‘",
  "&rsquo;": "’",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&iexcl;": "¡",
  "&iquest;": "¿",
  "&times;": "×",
  "&divide;": "÷",
  "&#x2F;": "/",
  "&#x5C;": "\\",
  "&#96;": "`",
};

export function decode(str: string): string {
  return str.replaceAll(/&[a-zA-Z0-9#]+;/g, (entity) => {
    if (entities[entity]) {
      return entities[entity];
    }

    const hexMatch = entity.match(/&#x([0-9a-fA-F]+);/);
    if (hexMatch) {
      return String.fromCharCode(parseInt(hexMatch[1], 16));
    }

    const decMatch = entity.match(/&#(\d+);/);
    if (decMatch) {
      return String.fromCharCode(parseInt(decMatch[1], 10));
    }

    return entity;
  });
}
