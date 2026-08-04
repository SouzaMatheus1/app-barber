import { normalizarPlaca, validarPlaca } from '../utils/validacaoVeiculo';
import { normalizarTelefone, validarTelefone } from '../utils/validacaoTelefone';

describe('Validação de Placa de Veículo', () => {
  describe('normalizarPlaca', () => {
    it('deve remover hífen/espaço e converter para uppercase', () => {
      expect(normalizarPlaca('abc-1234')).toBe('ABC1234');
      expect(normalizarPlaca('abc 1b34')).toBe('ABC1B34');
      expect(normalizarPlaca('ABC1234')).toBe('ABC1234');
    });
  });

  describe('validarPlaca', () => {
    it('deve aceitar o formato antigo válido (ABC1234)', () => {
      expect(validarPlaca('ABC1234')).toBe(true);
      expect(validarPlaca('abc-1234')).toBe(true);
    });

    it('deve aceitar o formato Mercosul válido (ABC1B34)', () => {
      expect(validarPlaca('ABC1B34')).toBe(true);
      expect(validarPlaca('abc1b34')).toBe(true);
    });

    it('deve rejeitar placas com tamanho inválido', () => {
      expect(validarPlaca('ABC123')).toBe(false);
      expect(validarPlaca('ABC12345')).toBe(false);
    });

    it('deve rejeitar placas com letras/números em posição errada', () => {
      expect(validarPlaca('AB1C234')).toBe(false);
      expect(validarPlaca('1234ABC')).toBe(false);
      expect(validarPlaca('ABCD234')).toBe(false);
    });
  });
});

describe('Validação de Telefone do Cliente', () => {
  describe('normalizarTelefone', () => {
    it('deve remover parênteses, espaço e hífen, mantendo apenas dígitos', () => {
      expect(normalizarTelefone('(11) 99999-9999')).toBe('11999999999');
      expect(normalizarTelefone('11 3333-4444')).toBe('1133334444');
    });
  });

  describe('validarTelefone', () => {
    it('deve aceitar telefone fixo com 10 dígitos', () => {
      expect(validarTelefone('1133334444')).toBe(true);
      expect(validarTelefone('(11) 3333-4444')).toBe(true);
    });

    it('deve aceitar celular com 11 dígitos', () => {
      expect(validarTelefone('11999999999')).toBe(true);
      expect(validarTelefone('(11) 99999-9999')).toBe(true);
    });

    it('deve rejeitar telefone com menos de 10 dígitos', () => {
      expect(validarTelefone('999999999')).toBe(false);
    });

    it('deve rejeitar telefone com mais de 11 dígitos', () => {
      expect(validarTelefone('119999999999')).toBe(false);
    });
  });
});
