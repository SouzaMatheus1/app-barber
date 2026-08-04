export function normalizarTelefone(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function validarTelefone(valor: string): boolean {
  const digitos = normalizarTelefone(valor);
  return digitos.length === 10 || digitos.length === 11;
}

// Formata os dígitos digitados para exibição no input: (XX) XXXXX-XXXX (celular) ou (XX) XXXX-XXXX (fixo).
export function formatarTelefone(valor: string): string {
  const digitos = normalizarTelefone(valor).slice(0, 11);

  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);

  const tamanhoPrefixo = digitos.length > 10 ? 5 : 4;
  const prefixo = resto.slice(0, tamanhoPrefixo);
  const sufixo = resto.slice(tamanhoPrefixo);

  if (sufixo.length === 0) return `(${ddd}) ${prefixo}`;
  return `(${ddd}) ${prefixo}-${sufixo}`;
}
