import { prisma, systemPrisma } from '../database/prisma';
import { tenantStorage } from '../database/tenantContext';

export interface TemaResponse {
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  corSuperficie: string;
  corTexto: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}

export const TemaService = {
  /**
   * Buscar tema pelo slug da empresa, mesclando campo a campo:
   * TemaEmpresa (específico do tenant) ?? TemaPadrao (do tipo de empresa/segmento)
   */
  async getBySlug(slug: string): Promise<TemaResponse | null> {
    // 1. Buscar a empresa globalmente (sem restrição de tenant) para obter o tipoEmpresaId e ID
    const empresa = await systemPrisma.empresa.findUnique({
      where: { slug },
      include: { tipo: true }
    });

    if (!empresa) {
      return null;
    }

    // 2. Buscar o tema padrão para o segmento da empresa
    const temaPadrao = await systemPrisma.temaPadrao.findUnique({
      where: { tipoEmpresaId: empresa.tipoEmpresaId }
    });

    // Se nem o tema padrão existir, usamos um fallback hardcoded de segurança (Barbearia)
    const fallbackTema = {
      corPrimaria: '#C9A84C',
      corSecundaria: '#E2C175',
      corFundo: '#0A0A0A',
      corSuperficie: '#111111',
      corTexto: '#F5F5F5',
      logoUrl: null,
      faviconUrl: null
    };

    const base = temaPadrao || fallbackTema;

    // 3. Buscar o tema customizado da empresa no contexto do tenant
    let temaEmpresa: any = null;
    await tenantStorage.run({ empresaId: empresa.id }, async () => {
      temaEmpresa = await prisma.temaEmpresa.findUnique({
        where: { empresaId: empresa.id }
      });
    });

    // 4. Mesclar campo a campo
    return {
      corPrimaria: temaEmpresa?.corPrimaria ?? base.corPrimaria,
      corSecundaria: temaEmpresa?.corSecundaria ?? base.corSecundaria,
      corFundo: temaEmpresa?.corFundo ?? base.corFundo,
      corSuperficie: temaEmpresa?.corSuperficie ?? base.corSuperficie,
      corTexto: temaEmpresa?.corTexto ?? base.corTexto,
      logoUrl: temaEmpresa?.logoUrl ?? base.logoUrl,
      faviconUrl: temaEmpresa?.faviconUrl ?? base.faviconUrl
    };
  },

  /**
   * Atualiza ou cria o tema específico de uma empresa
   */
  async updateTemaEmpresa(empresaId: number, data: Partial<TemaResponse>): Promise<any> {
    return prisma.temaEmpresa.upsert({
      where: { empresaId },
      create: {
        empresaId,
        corPrimaria: data.corPrimaria ?? null,
        corSecundaria: data.corSecundaria ?? null,
        corFundo: data.corFundo ?? null,
        corSuperficie: data.corSuperficie ?? null,
        corTexto: data.corTexto ?? null,
        logoUrl: data.logoUrl ?? null,
        faviconUrl: data.faviconUrl ?? null
      },
      update: {
        corPrimaria: data.corPrimaria ?? null,
        corSecundaria: data.corSecundaria ?? null,
        corFundo: data.corFundo ?? null,
        corSuperficie: data.corSuperficie ?? null,
        corTexto: data.corTexto ?? null,
        logoUrl: data.logoUrl ?? null,
        faviconUrl: data.faviconUrl ?? null
      }
    });
  }
};
