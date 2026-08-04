import { describe, it, expect } from 'vitest';
import { normalizarPlaca, validarPlaca, formatarPlaca } from '../validacaoVeiculo';

describe('validacaoVeiculo utility', () => {
  describe('normalizarPlaca', () => {
    it('deve remover hífen/espaço e converter para uppercase', () => {
      expect(normalizarPlaca('abc-1234')).toBe('ABC1234');
      expect(normalizarPlaca('abc 1b34')).toBe('ABC1B34');
    });
  });

  describe('validarPlaca', () => {
    it('deve aceitar o formato antigo válido', () => {
      expect(validarPlaca('ABC1234')).toBe(true);
    });

    it('deve aceitar o formato Mercosul válido', () => {
      expect(validarPlaca('ABC1B34')).toBe(true);
    });

    it('deve rejeitar placas inválidas', () => {
      expect(validarPlaca('ABC123')).toBe(false);
      expect(validarPlaca('AB1C234')).toBe(false);
    });
  });

  describe('formatarPlaca', () => {
    it('não formata enquanto o formato ainda é ambíguo (até 4 caracteres)', () => {
      expect(formatarPlaca('A')).toBe('A');
      expect(formatarPlaca('ABC1')).toBe('ABC1');
    });

    it('formata como formato antigo (com hífen) quando o 5º caractere é dígito', () => {
      expect(formatarPlaca('ABC12')).toBe('ABC-12');
      expect(formatarPlaca('abc-1234')).toBe('ABC-1234');
    });

    it('formata como Mercosul (sem hífen) quando o 5º caractere é letra', () => {
      expect(formatarPlaca('ABC1B')).toBe('ABC1B');
      expect(formatarPlaca('abc1b34')).toBe('ABC1B34');
    });

    it('ignora caracteres além do 7º', () => {
      expect(formatarPlaca('ABC1234999')).toBe('ABC-1234');
      expect(formatarPlaca('ABC1B34999')).toBe('ABC1B34');
    });
  });
});
