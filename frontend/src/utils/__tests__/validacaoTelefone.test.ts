import { describe, it, expect } from 'vitest';
import { normalizarTelefone, validarTelefone, formatarTelefone } from '../validacaoTelefone';

describe('validacaoTelefone utility', () => {
  describe('normalizarTelefone', () => {
    it('deve remover parênteses, espaço e hífen, mantendo apenas dígitos', () => {
      expect(normalizarTelefone('(11) 99999-9999')).toBe('11999999999');
      expect(normalizarTelefone('11 3333-4444')).toBe('1133334444');
    });
  });

  describe('validarTelefone', () => {
    it('deve aceitar telefone fixo com 10 dígitos', () => {
      expect(validarTelefone('(11) 3333-4444')).toBe(true);
    });

    it('deve aceitar celular com 11 dígitos', () => {
      expect(validarTelefone('(11) 99999-9999')).toBe(true);
    });

    it('deve rejeitar telefone com menos de 10 dígitos', () => {
      expect(validarTelefone('999999999')).toBe(false);
    });

    it('deve rejeitar telefone com mais de 11 dígitos', () => {
      expect(validarTelefone('119999999999')).toBe(false);
    });
  });

  describe('formatarTelefone', () => {
    it('deve formatar progressivamente enquanto o usuário digita', () => {
      expect(formatarTelefone('11')).toBe('(11');
      expect(formatarTelefone('1133334')).toBe('(11) 3333-4');
      expect(formatarTelefone('1199999999')).toBe('(11) 9999-9999');
    });

    it('deve formatar celular completo com 11 dígitos', () => {
      expect(formatarTelefone('11999999999')).toBe('(11) 99999-9999');
    });

    it('deve formatar fixo completo com 10 dígitos', () => {
      expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444');
    });

    it('deve ignorar dígitos além do 11º', () => {
      expect(formatarTelefone('119999999999999')).toBe('(11) 99999-9999');
    });
  });
});
