export function normalizarTelefone(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function validarTelefone(valor: string): boolean {
  const digitos = normalizarTelefone(valor);
  return digitos.length === 10 || digitos.length === 11;
}
