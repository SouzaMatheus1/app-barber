const REGEX_PLACA_ANTIGA = /^[A-Z]{3}[0-9]{4}$/;
const REGEX_PLACA_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export function normalizarPlaca(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validarPlaca(valor: string): boolean {
  const limpo = normalizarPlaca(valor);
  return REGEX_PLACA_ANTIGA.test(limpo) || REGEX_PLACA_MERCOSUL.test(limpo);
}

// Formata os caracteres digitados para exibição: ABC-1234 (formato antigo) ou ABC1B34 (Mercosul).
// O formato só é decidido a partir do 5º caractere (letra = Mercosul, dígito = antigo).
export function formatarPlaca(valor: string): string {
  const limpo = normalizarPlaca(valor).slice(0, 7);

  if (limpo.length <= 4) return limpo;

  const isMercosul = /[A-Z]/.test(limpo[4]);
  if (isMercosul) return limpo;

  return `${limpo.slice(0, 3)}-${limpo.slice(3)}`;
}
