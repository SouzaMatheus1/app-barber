import { Router } from 'express';
import { ProfissionalController } from '../controllers/ProfissionalController'
import { ItemCatalogoController } from '../controllers/ItemCatalogoController';
import { ClienteController } from '../controllers/ClienteController'
import { TransacaoController } from '../controllers/TransacaoController';
import { ComissaoController } from '../controllers/ComissaoController';
import { CaixaController } from '../controllers/CaixaController';
import { isAuth, isSuperAdmin, isTenantAdmin } from '../middleware/auth';
import { AuthController } from '../controllers/authController';
import { AssinaturaController } from '../controllers/AssinaturaController';
import { TenancyController } from '../controllers/TenancyController';

const routes = Router();
const profissionalController = new ProfissionalController();
const itemCatalogoController = new ItemCatalogoController();
const clienteController = new ClienteController();
const transacaoController = new TransacaoController();
const comissaoController = new ComissaoController();
const caixaController = new CaixaController();
const authController = new AuthController();
const assinaturaController = new AssinaturaController();
const tenancyController = new TenancyController();

// profissional
routes.get('/profissionais', isAuth, profissionalController.listar);
routes.post('/profissionais', isAuth, isTenantAdmin, profissionalController.criar);
routes.put('/profissionais/:id', isAuth, isTenantAdmin, profissionalController.editar);
routes.delete('/profissionais/:id', isAuth, isTenantAdmin, profissionalController.deletar);

// cliente
routes.get('/clientes/search', isAuth, clienteController.search);
routes.get('/clientes', isAuth, clienteController.listar);
routes.post('/clientes', isAuth, clienteController.criar);
routes.put('/clientes/:id', isAuth, clienteController.editar);
routes.delete('/clientes/:id', isAuth, clienteController.deletar);

// item catalogo
routes.get('/itens', isAuth, itemCatalogoController.listar);
routes.post('/itens', isAuth, isTenantAdmin, itemCatalogoController.criar);
routes.put('/itens/:id', isAuth, isTenantAdmin, itemCatalogoController.editar);
routes.delete('/itens/:id', isAuth, isTenantAdmin, itemCatalogoController.deletar);

// transacao
routes.get('/transacoes', isAuth, transacaoController.listar);
routes.post('/transacoes', isAuth, transacaoController.criar);
routes.delete('/transacoes/:id', isAuth, transacaoController.deletar);

// plano & assinatura
routes.get('/planos', isAuth, assinaturaController.listarPlanos);
routes.post('/planos', isAuth, isTenantAdmin, assinaturaController.criarPlano);
routes.put('/planos/:id', isAuth, isTenantAdmin, assinaturaController.editarPlano);
routes.delete('/planos/:id', isAuth, isTenantAdmin, assinaturaController.deletarPlano);
routes.get('/assinaturas', isAuth, assinaturaController.listarAssinaturas);
routes.post('/assinaturas', isAuth, assinaturaController.assinar);
routes.get('/assinaturas/cliente/:clienteId/ativa', isAuth, assinaturaController.getAssinaturaCliente);

// comissao funcionarios
routes.get('/comissoes/profissional/:id', isAuth, comissaoController.relatorio);

// resumo caixa diario (Protegido por Tenant Admin)
routes.get('/caixa/diario', isAuth, isTenantAdmin, caixaController.resumo);

// TENANCY (SUPER ADMIN APENAS)
routes.get('/tenants', isAuth, isSuperAdmin, tenancyController.listar);
routes.post('/tenants', isAuth, isSuperAdmin, tenancyController.criar);

routes.post('/login', authController.login)

export { routes };