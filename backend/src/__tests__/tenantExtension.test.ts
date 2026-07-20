import { tenantQueryExtension } from '../database/prisma';
import { tenantStorage } from '../database/tenantContext';

describe('Prisma Tenant Extension', () => {
  it('deve lançar erro se tentar acessar modelo de tenant sem contexto ativo', async () => {
    const querySpy = jest.fn();
    const promise = tenantQueryExtension({
      args: {},
      query: querySpy,
      model: 'Cliente',
      operation: 'findMany'
    });
    await expect(promise).rejects.toThrow(
      "[Multi-tenant] Tentativa de acesso a 'Cliente' sem contexto de tenant ativo."
    );
    expect(querySpy).not.toHaveBeenCalled();
  });

  it('deve injetar empresaId em findMany com contexto ativo', async () => {
    const querySpy = jest.fn().mockResolvedValue([]);
    const args = { where: { nome: 'Carlos' } };

    await tenantStorage.run({ empresaId: 42 }, async () => {
      await tenantQueryExtension({
        args,
        query: querySpy,
        model: 'Cliente',
        operation: 'findMany'
      });
    });

    expect(querySpy).toHaveBeenCalledWith({
      where: { nome: 'Carlos', empresaId: 42 }
    });
  });

  it('deve injetar empresaId em findUnique com chave simples', async () => {
    const querySpy = jest.fn().mockResolvedValue(null);
    const args = { where: { id: 10 } };

    await tenantStorage.run({ empresaId: 42 }, async () => {
      await tenantQueryExtension({
        args,
        query: querySpy,
        model: 'Cliente',
        operation: 'findUnique'
      });
    });

    expect(querySpy).toHaveBeenCalledWith({
      where: { id: 10, empresaId: 42 }
    });
  });

  it('deve injetar empresaId em findUnique com chave composta (FechamentoCaixa)', async () => {
    const querySpy = jest.fn().mockResolvedValue(null);
    const args = {
      where: {
        empresaId_data: {
          empresaId: 42,
          data: '2026-07-20'
        }
      }
    };

    await tenantStorage.run({ empresaId: 42 }, async () => {
      await tenantQueryExtension({
        args,
        query: querySpy,
        model: 'FechamentoCaixa',
        operation: 'findUnique'
      });
    });

    expect(querySpy).toHaveBeenCalledWith({
      where: {
        empresaId_data: {
          empresaId: 42,
          data: '2026-07-20'
        },
        empresaId: 42
      }
    });
  });

  it('deve injetar empresaId em create se não fornecido', async () => {
    const querySpy = jest.fn().mockResolvedValue({});
    const args = { data: { nome: 'Carlos' } };

    await tenantStorage.run({ empresaId: 42 }, async () => {
      await tenantQueryExtension({
        args,
        query: querySpy,
        model: 'Cliente',
        operation: 'create'
      });
    });

    expect(querySpy).toHaveBeenCalledWith({
      data: { nome: 'Carlos', empresaId: 42 }
    });
  });

  it('deve injetar empresaId em createMany', async () => {
    const querySpy = jest.fn().mockResolvedValue({ count: 2 });
    const args = {
      data: [{ nome: 'Carlos' }, { nome: 'Mari' }]
    };

    await tenantStorage.run({ empresaId: 42 }, async () => {
      await tenantQueryExtension({
        args,
        query: querySpy,
        model: 'Cliente',
        operation: 'createMany'
      });
    });

    expect(querySpy).toHaveBeenCalledWith({
      data: [
        { nome: 'Carlos', empresaId: 42 },
        { nome: 'Mari', empresaId: 42 }
      ]
    });
  });
});
