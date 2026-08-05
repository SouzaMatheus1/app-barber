import { describe, it, expect } from 'vitest';
import { getLabelPorSegmento } from '../labelsPorSegmento';

describe('labelsPorSegmento utility', () => {
  it('should return correct labels for petshop business vertical', () => {
    expect(getLabelPorSegmento('petshop', 'barbeiro')).toBe('Profissional');
    expect(getLabelPorSegmento('Pet Shop', 'barbeiros')).toBe('Profissionais');
    expect(getLabelPorSegmento('pet', 'selecione_um_barbeiro')).toBe('Selecione um profissional');
    expect(getLabelPorSegmento('PET', 'todos_profissionais')).toBe('Todos os Profissionais');
  });

  it('should return correct labels for lava rapido business vertical', () => {
    expect(getLabelPorSegmento('lava_rapido', 'barbeiro')).toBe('Lavador');
    expect(getLabelPorSegmento('Lava Rápido', 'barbeiros')).toBe('Lavadores');
    expect(getLabelPorSegmento('car_wash', 'selecione_um_barbeiro')).toBe('Selecione um lavador');
    expect(getLabelPorSegmento('LAVA', 'todos_profissionais')).toBe('Todos os Lavadores');
  });

  it('should return correct labels for barbearia business vertical', () => {
    expect(getLabelPorSegmento('barbearia', 'barbeiro')).toBe('Barbeiro');
    expect(getLabelPorSegmento('Barbearia', 'barbeiros')).toBe('Barbeiros');
    expect(getLabelPorSegmento('BARB', 'selecione_um_barbeiro')).toBe('Selecione um barbeiro');
    expect(getLabelPorSegmento('barbearia', 'todos_profissionais')).toBe('Todos os Barbeiros');
  });

  it('should default to generic "profissional" labels for unmapped or empty tipoEmpresa', () => {
    expect(getLabelPorSegmento(undefined, 'barbeiros')).toBe('Profissionais');
    expect(getLabelPorSegmento('unknown', 'selecione_um_barbeiro')).toBe('Selecione um profissional');
    expect(getLabelPorSegmento('', 'todos_profissionais')).toBe('Todos os Profissionais');
    expect(getLabelPorSegmento('Alongamento de Unhas', 'barbeiro')).toBe('Profissional');
  });
});
