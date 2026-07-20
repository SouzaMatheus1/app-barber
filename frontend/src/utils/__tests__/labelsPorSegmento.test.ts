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

  it('should return correct labels for barbearia business vertical by default', () => {
    expect(getLabelPorSegmento('barbearia', 'barbeiro')).toBe('Barbeiro');
    expect(getLabelPorSegmento(undefined, 'barbeiros')).toBe('Barbeiros');
    expect(getLabelPorSegmento('unknown', 'selecione_um_barbeiro')).toBe('Selecione um barbeiro');
    expect(getLabelPorSegmento('', 'todos_profissionais')).toBe('Todos os Barbeiros');
  });
});
