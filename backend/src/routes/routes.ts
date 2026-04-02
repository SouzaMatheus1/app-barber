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

const routes = Router();
const profissionalController = new ProfissionalController();
const itemCatalogoController = new ItemCatalogoController();
const clienteController = new ClienteController();
const transacaoController = new TransacaoController();
const comissaoController = new ComissaoController();
const caixaController = new CaixaController();
const authController = new AuthController();
const assinaturaController = new AssinaturaController();

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
routes.delete('/transacoes/:id', isAuth, transacaoController.deletar);

// plano & assinatura
routes.get('/planos', isAuth, assinaturaController.listarPlanos);
routes.post('/planos', isAuth, assinaturaController.criarPlano);
routes.put('/planos/:id', isAuth, assinaturaController.editarPlano);
routes.delete('/planos/:id', isAuth, assinaturaController.deletarPlano);
routes.get('/assinaturas', isAuth, assinaturaController.listarAssinaturas);
routes.post('/assinaturas', isAuth, assinaturaController.assinar);
routes.get('/assinaturas/cliente/:clienteId/ativa', isAuth, assinaturaController.getAssinaturaCliente);

// comissao funcionarios
routes.get('/comissoes/profissional/:id', isAuth, comissaoController.relatorio);

// rotas protegidas
// resumo caixa diario
routes.get('/caixa/diario', isAuth, isAdmin, caixaController.resumo);

routes.post('/login', authController.login)

export { routes };