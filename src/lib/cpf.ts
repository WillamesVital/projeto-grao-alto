/** Calcula um dígito verificador de CPF a partir da base de dígitos anteriores. */
function calcCheckDigit(base: string): number {
  let sum = 0;
  let weight = base.length + 1;
  for (const digit of base) {
    sum += Number(digit) * weight;
    weight--;
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/**
 * Valida CPF pelo dígito verificador (não só o formato). Rejeita casos como
 * `111.111.111-11`, que têm o formato certo mas nunca são CPFs reais.
 */
export function isValidCPF(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const d1 = calcCheckDigit(digits.slice(0, 9));
  const d2 = calcCheckDigit(digits.slice(0, 9) + d1);

  return digits[9] === String(d1) && digits[10] === String(d2);
}
