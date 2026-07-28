const COMBINING_MARK_START = 0x0300;
const COMBINING_MARK_END = 0x036f;

/** Normaliza texto para busca/comparação: sem acento, minúsculo, sem espaços nas pontas. */
export function normalizeText(value: string) {
  const decomposed = value.normalize("NFD");
  let result = "";
  for (const char of decomposed) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= COMBINING_MARK_START && code <= COMBINING_MARK_END) continue;
    result += char;
  }
  return result.toLowerCase().trim();
}
