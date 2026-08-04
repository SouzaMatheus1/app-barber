const REGEX_PLACA_ANTIGA = /^[A-Z]{3}[0-9]{4}$/;
const REGEX_PLACA_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export function normalizarPlaca(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validarPlaca(valor: string): boolean {
  const limpo = normalizarPlaca(valor);
  return REGEX_PLACA_ANTIGA.test(limpo) || REGEX_PLACA_MERCOSUL.test(limpo);
}
