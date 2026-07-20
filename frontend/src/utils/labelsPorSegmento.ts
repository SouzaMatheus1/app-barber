import React from 'react';
import { Scissors, PawPrint, Car } from 'lucide-react';

export function getIconePorSegmento(tipoEmpresa: string | undefined): React.ComponentType<any> {
  const tipo = tipoEmpresa?.toLowerCase() || '';
  if (tipo.includes('pet')) {
    return PawPrint;
  }
  if (tipo.includes('lava') || tipo.includes('car')) {
    return Car;
  }
  return Scissors;
}

export function getLabelPorSegmento(
  tipoEmpresa: string | undefined,
  context:
    | 'selecione_barbeiro'
    | 'selecione_um_barbeiro'
    | 'barbeiro'
    | 'barbeiros'
    | 'gerencie_barbeiros'
    | 'escolha_barbeiro'
    | 'carregando_barbeiros'
    | 'agenda_barbeiro'
    | 'sem_horarios_barbeiro'
    | 'todos_profissionais'
): string {
  const tipo = tipoEmpresa?.toLowerCase() || '';

  if (tipo.includes('pet')) {
    switch (context) {
      case 'selecione_barbeiro':
        return 'Selecione o profissional';
      case 'selecione_um_barbeiro':
        return 'Selecione um profissional';
      case 'barbeiro':
        return 'Profissional';
      case 'barbeiros':
        return 'Profissionais';
      case 'gerencie_barbeiros':
        return 'Gerencie a equipe de profissionais e administradores.';
      case 'escolha_barbeiro':
        return 'Escolha o Profissional';
      case 'carregando_barbeiros':
        return 'Carregando profissionais...';
      case 'agenda_barbeiro':
        return 'Verificando agenda do profissional...';
      case 'sem_horarios_barbeiro':
        return 'Infelizmente não há horários livres para este profissional na data selecionada. Tente outro dia ou profissional.';
      case 'todos_profissionais':
        return 'Todos os Profissionais';
      default:
        return 'Profissional';
    }
  }

  if (tipo.includes('lava') || tipo.includes('car')) {
    switch (context) {
      case 'selecione_barbeiro':
        return 'Selecione o lavador';
      case 'selecione_um_barbeiro':
        return 'Selecione um lavador';
      case 'barbeiro':
        return 'Lavador';
      case 'barbeiros':
        return 'Lavadores';
      case 'gerencie_barbeiros':
        return 'Gerencie a equipe de lavadores e administradores.';
      case 'escolha_barbeiro':
        return 'Escolha o Lavador';
      case 'carregando_barbeiros':
        return 'Carregando lavadores...';
      case 'agenda_barbeiro':
        return 'Verificando agenda do lavador...';
      case 'sem_horarios_barbeiro':
        return 'Infelizmente não há horários livres para este lavador na data selecionada. Tente outro dia ou profissional.';
      case 'todos_profissionais':
        return 'Todos os Lavadores';
      default:
        return 'Lavador';
    }
  }

  // Padrão: Barbearia
  switch (context) {
    case 'selecione_barbeiro':
      return 'Selecione o barbeiro';
    case 'selecione_um_barbeiro':
      return 'Selecione um barbeiro';
    case 'barbeiro':
      return 'Barbeiro';
    case 'barbeiros':
      return 'Barbeiros';
    case 'gerencie_barbeiros':
      return 'Gerencie a equipe de barbeiros e administradores.';
    case 'escolha_barbeiro':
      return 'Escolha o Barbeiro';
    case 'carregando_barbeiros':
      return 'Carregando barbeiros...';
    case 'agenda_barbeiro':
      return 'Verificando agenda do barbeiro...';
    case 'sem_horarios_barbeiro':
      return 'Infelizmente não há horários livres para este barbeiro na data selecionada. Tente outro dia ou profissional.';
    case 'todos_profissionais':
      return 'Todos os Barbeiros';
    default:
      return 'Barbeiro';
  }
}
