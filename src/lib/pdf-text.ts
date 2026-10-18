/**
 * pdf-lib's standard fonts only encode WinAnsi (CP1252). Map common Unicode symbols used in
 * the spec (CO₂, ∞, ≤, ...) to safe equivalents and drop anything else that can't be encoded.
 */
const REPLACEMENTS: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  "∞": "inf", "≤": "<=", "≥": ">=", "→": "->", "←": "<-", "✓": "v", "×": "x", " ": " ",
};

// CP1252 characters outside Latin-1 that WinAnsi can encode.
const CP1252_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");

export function winAnsi(text: string): string {
  let out = "";
  for (const ch of text) {
    const rep = REPLACEMENTS[ch];
    if (rep !== undefined) out += rep;
    else if (ch === "\n" || ch === "\t") out += " ";
    else if (ch.charCodeAt(0) >= 0x20 && (ch.charCodeAt(0) <= 0xff || CP1252_EXTRA.has(ch))) out += ch;
    else out += "?";
  }
  return out;
}
