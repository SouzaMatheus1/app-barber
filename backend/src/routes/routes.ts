import { Router } from 'express';
import { ProfissionalController } from '../controllers/ProfissionalController'
import { ItemCatalogoController } from '../controllers/ItemCatalogoController';
import { ClienteController } from '../controllers/ClienteController'
import { TransacaoController } from '../controllers/TransacaoController';
import { ComissaoController } from '../controllers/ComissaoController';
import { CaixaController } from '../controllers/CaixaController';
import { isAuth, isAdmin } from '../middleware/auth';
import { AuthController } from '../controllers/authController';
import { AssinaturaController } from '../controllers/AssinaturaController';
import { TemaController } from '../controllers/TemaController';
import { CategoriaCustoController } from '../controllers/CategoriaCustoController';
import { FinanceiroController } from '../controllers/FinanceiroController';
import { RelatorioController } from '../controllers/RelatorioController';
import { AgendamentoController } from '../controllers/AgendamentoController';
import { PortalAuthController } from '../controllers/PortalAuthController';

const routes = Router();
const profissionalController = new ProfissionalController();
const itemCatalogoController = new ItemCatalogoController();
const clienteController = new ClienteController();
const transacaoController = new TransacaoController();
const comissaoController = new ComissaoController();
const caixaController = new CaixaController();
const authController = new AuthController();
const assinaturaController = new AssinaturaController();
const categoriaCustoController = new CategoriaCustoController();
const financeiroController = new FinanceiroController();
const relatorioController = new RelatorioController();
const agendamentoController = new AgendamentoController();
const portalAuthController = new PortalAuthController();

// profissional
routes.get('/profissionais', isAuth, profissionalController.listar);
routes.post('/profissionais', isAuth, profissionalController.criar);
routes.put('/profissionais/:id', isAuth, profissionalController.editar);
routes.delete('/profissionais/:id', isAuth, profissionalController.deletar);

// cliente
routes.get('/clientes/search', isAuth, clienteController.search);
routes.get('/clientes', isAuth, clienteController.listar);
routes.post('/clientes', isAuth, clienteController.criar);
routes.put('/clientes/:id', isAuth, clienteController.editar);
routes.delete('/clientes/:id', isAuth, clienteController.deletar);

// item catalogo
routes.get('/itens', isAuth, itemCatalogoController.listar);
routes.post('/itens', isAuth, itemCatalogoController.criar);
routes.put('/itens/:id', isAuth, itemCatalogoController.editar);
routes.delete('/itens/:id', isAuth, itemCatalogoController.deletar);

// transacao
routes.get('/transacoes', isAuth, transacaoController.listar);
routes.post('/transacoes', isAuth, transacaoController.criar);
routes.put('/transacoes/:id', isAuth, transacaoController.editar);
routes.delete('/transacoes/:id', isAuth, transacaoController.deletar);

// categorias de custo
routes.get('/categorias-custo', isAuth, categoriaCustoController.listar);
routes.post('/categorias-custo', isAuth, categoriaCustoController.criar);
routes.put('/categorias-custo/:id', isAuth, categoriaCustoController.editar);
routes.delete('/categorias-custo/:id', isAuth, categoriaCustoController.deletar);

// plano & assinatura
routes.get('/planos', isAuth, assinaturaController.listarPlanos);
routes.post('/planos', isAuth, assinaturaController.criarPlano);
routes.put('/planos/:id', isAuth, assinaturaController.editarPlano);
routes.delete('/planos/:id', isAuth, assinaturaController.deletarPlano);
routes.get('/assinaturas', isAuth, assinaturaController.listarAssinaturas);
routes.post('/assinaturas', isAuth, assinaturaController.assinar);
routes.patch('/assinaturas/:id/renovar', isAuth, assinaturaController.renovar);
routes.get('/assinaturas/cliente/:clienteId/ativa', isAuth, assinaturaController.getAssinaturaCliente);
routes.get('/portal/minha-assinatura', isAuth, assinaturaController.getMinhaAssinatura);

// comissao funcionarios
routes.get('/comissoes/profissional/:id', isAuth, comissaoController.relatorio);

// rotas protegidas
// resumo caixa diario
routes.get('/caixa/diario', isAuth, isAdmin, caixaController.resumo);

// fluxo de caixa
routes.get('/financeiro/fluxo-caixa', isAuth, financeiroController.fluxoCaixa);
routes.get('/relatorios/vendas-produtos', isAuth, relatorioController.vendasProdutos);

routes.post('/login', authController.login)

// temas
// Rota pública: Frontend chama na hora do login ou agendamento para pegar as cores/logo da empresa
routes.get('/temas/empresa/:slug', TemaController.getBySlug);

// Rota privada: Painel administrativo altera as cores (precisa de token)
routes.put('/temas', isAuth, TemaController.update);

// Agendamentos
routes.get('/agendamentos/disponibilidade', isAuth, agendamentoController.getDisponibilidade);
routes.get('/agendamentos', isAuth, agendamentoController.listar);
routes.post('/agendamentos', isAuth, agendamentoController.criar);
routes.put('/agendamentos/:id/status', isAuth, agendamentoController.alterarStatus);
routes.delete('/agendamentos/:id', isAuth, agendamentoController.deletar);

// Portal do Cliente
routes.get('/portal/:slug/empresa', portalAuthController.getEmpresa);
routes.post('/portal/:slug/auth/check-phone', portalAuthController.checkPhone);
routes.post('/portal/:slug/auth/login', portalAuthController.login);
routes.post('/portal/:slug/auth/register', portalAuthController.register);

export { routes };