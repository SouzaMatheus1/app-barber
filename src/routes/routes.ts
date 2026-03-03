import { Router } from 'express';
import { ProfissionalController } from '../controllers/ProfissionalController'
import { ItemCatalogoController } from '../controllers/ItemCatalogoController';
import { ClienteController } from '../controllers/ClienteController'
import { TransacaoController } from '../controllers/TransacaoController';
import { ComissaoController } from '../controllers/ComissaoController';

const routes = Router();
const profissionalController = new ProfissionalController();
const itemCatalogoController = new ItemCatalogoController();
const clienteController = new ClienteController();
const transacaoController = new TransacaoController();
const comissaoController = new ComissaoController();

// profissional
routes.get('/profissionais', profissionalController.listar);
routes.post('/profissionais', profissionalController.criar);
routes.put('/profissionais/:id', profissionalController.editar);
routes.delete('/profissionais/:id', profissionalController.deletar);

// cliente
routes.get('/clientes', clienteController.listar);
routes.post('/clientes', clienteController.criar);
routes.put('/clientes/:id', clienteController.editar);
routes.delete('/clientes/:id', clienteController.deletar);

// item catalogo
routes.get('/itens', itemCatalogoController.listar);
routes.post('/itens', itemCatalogoController.criar);
routes.put('/itens/:id', itemCatalogoController.editar);
routes.delete('/itens/:id', itemCatalogoController.deletar);

// transacao
routes.get('/transacoes', transacaoController.listar);
routes.post('/transacoes', transacaoController.criar);
// routes.put('/transacoes/:id', transacaoController.editar);
routes.delete('/transacoes/:id', transacaoController.deletar);

// comissao funcionarios
routes.get('/comissoes/profissional/:id', comissaoController.relatorio);

export { routes };