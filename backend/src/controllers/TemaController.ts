import { Request, Response } from 'express';
import { prisma } from '../database/prisma';

export const TemaController = {
  // Rota pública: Buscar tema pelo slug da empresa
  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug as string;

      const empresa = await prisma.empresa.findUnique({
        where: { slug },
        include: { tema: true },
      });

      if (!empresa) {
        res.status(404).json({ error: 'Empresa não encontrada' });
        return;
      }

      // Se a empresa não tiver um tema customizado, retorna um default (ou o que está default no DB)
      // Como configuramos defaults no Prisma, um novo registro na tabela Tema já vem com as cores.
      // Porém, se a linha Tema nem existir para essa empresa, enviamos um payload padrão.
      const tema = empresa.tema || {
        corPrimaria: '#C9A84C',
        corSecundaria: '#E2C175',
        corFundo: '#0A0A0A',
        corSuperficie: '#111111',
        corTexto: '#F5F5F5',
        logoUrl: null,
        faviconUrl: null
      };

      res.status(200).json(tema);
    } catch (error) {
      console.error('Erro ao buscar tema:', error);
      res.status(500).json({ error: 'Erro interno ao buscar o tema.' });
    }
  },

  // Rota privada: Atualizar ou criar o tema da própria empresa logada
  async update(req: Request, res: Response): Promise<void> {
    try {
      const empresaId = res.locals.user?.empresaId; // Vem do token JWT via middleware
      const dadosTema = req.body;

      if (!empresaId) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
      }

      // Verifica se a empresa já tem um registro de tema
      const temaAtual = await prisma.tema.findUnique({
        where: { empresaId }
      });

      let temaAtualizado;

      if (temaAtual) {
        temaAtualizado = await prisma.tema.update({
          where: { empresaId },
          data: {
            corPrimaria: dadosTema.corPrimaria,
            corSecundaria: dadosTema.corSecundaria,
            corFundo: dadosTema.corFundo,
            corSuperficie: dadosTema.corSuperficie,
            corTexto: dadosTema.corTexto,
            logoUrl: dadosTema.logoUrl,
            faviconUrl: dadosTema.faviconUrl
          }
        });
      } else {
        temaAtualizado = await prisma.tema.create({
          data: {
            empresaId,
            corPrimaria: dadosTema.corPrimaria,
            corSecundaria: dadosTema.corSecundaria,
            corFundo: dadosTema.corFundo,
            corSuperficie: dadosTema.corSuperficie,
            corTexto: dadosTema.corTexto,
            logoUrl: dadosTema.logoUrl,
            faviconUrl: dadosTema.faviconUrl
          }
        });
      }

      res.status(200).json(temaAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar tema:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar o tema.' });
    }
  }
};
