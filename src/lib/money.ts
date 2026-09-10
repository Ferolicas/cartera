export const MAX_AMOUNT_CENTS = 2_000_000_000;

export function amountToCents(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Introduce un importe válido con hasta dos decimales");
  }

  const [whole, decimals = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents < 1 || cents > MAX_AMOUNT_CENTS) {
    throw new Error("El importe está fuera del rango permitido");
  }

  return cents;
}

export function signedAmountToCents(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");

  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Introduce un saldo válido con hasta dos decimales");
  }

  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(cents) > MAX_AMOUNT_CENTS) {
    throw new Error("El saldo está fuera del rango permitido");
  }

  return cents;
}

export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}
