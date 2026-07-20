import { AgendamentoService } from '../services/AgendamentoService';
import { prisma } from '../database/prisma';
import { tenantStorage } from '../database/tenantContext';

// Mocking o prisma client
jest.mock('../database/prisma', () => {
  const mockPrisma = {
    agendamento: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    ativo: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (arg) => {
      if (typeof arg === 'function') {
        return arg(mockPrisma);
      }
      return Promise.resolve({});
    }),
  };
  return {
    prisma: mockPrisma,
    systemPrisma: mockPrisma,
  };
});

describe('AgendamentoService - Validação de Titularidade do Ativo', () => {
  let service: AgendamentoService;

  beforeAll(() => {
    service = new AgendamentoService();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve rejeitar se o ativo informado não pertencer ao cliente', async () => {
    // Cliente A (ID: 1) tem o Ativo A (ID: 10)
    // Cliente B (ID: 2) tenta agendar usando o Ativo A (ID: 10)

    // Overbooking check retorna null (livre)
    (prisma.agendamento.findFirst as jest.Mock).mockResolvedValueOnce(null);

    // Ativo check para o Cliente B (ID: 2) com Ativo A (ID: 10) retorna null
    (prisma.ativo.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const dataInput = {
      dataHoraInicio: new Date(Date.now() + 60 * 60000).toISOString(),
      dataHoraFim: new Date(Date.now() + 90 * 60000).toISOString(),
      clienteId: 2,
      profissionalId: 1,
      servicosIds: [1],
      ativoId: 10,
    };

    const promise = tenantStorage.run({ empresaId: 1 }, () => {
      return service.criar(dataInput);
    });

    await expect(promise).rejects.toThrow('O ativo informado não pertence ao cliente.');
    expect(prisma.ativo.findFirst).toHaveBeenCalledWith({
      where: { id: 10, clienteId: 2 }
    });
    expect(prisma.agendamento.create).not.toHaveBeenCalled();
  });

  it('deve criar o agendamento com sucesso se o ativo pertencer ao próprio cliente', async () => {
    // Cliente A (ID: 1) agenda usando seu próprio Ativo A (ID: 10)

    // Overbooking check retorna null (livre)
    (prisma.agendamento.findFirst as jest.Mock).mockResolvedValueOnce(null);

    // Ativo check para o Cliente A (ID: 1) com Ativo A (ID: 10) retorna o ativo
    const mockAtivo = { id: 10, clienteId: 1, nome: 'Carro do Cliente A' };
    (prisma.ativo.findFirst as jest.Mock).mockResolvedValueOnce(mockAtivo);

    // Create check retorna o agendamento criado
    const mockAgendamento = {
      id: 100,
      empresaId: 1,
      dataHoraInicio: new Date(),
      dataHoraFim: new Date(),
      clienteId: 1,
      profissionalId: 1,
      ativoId: 10,
      status: 'CONFIRMADO'
    };
    (prisma.agendamento.create as jest.Mock).mockResolvedValueOnce(mockAgendamento);

    const dataInput = {
      dataHoraInicio: new Date(Date.now() + 60 * 60000).toISOString(),
      dataHoraFim: new Date(Date.now() + 90 * 60000).toISOString(),
      clienteId: 1,
      profissionalId: 1,
      servicosIds: [1],
      ativoId: 10,
    };

    const result = await tenantStorage.run({ empresaId: 1 }, () => {
      return service.criar(dataInput);
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(100);
    expect(prisma.ativo.findFirst).toHaveBeenCalledWith({
      where: { id: 10, clienteId: 1 }
    });
    expect(prisma.agendamento.create).toHaveBeenCalledTimes(1);
  });
});
