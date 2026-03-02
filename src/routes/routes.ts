import { Router } from 'express';
import { ProfissionalController } from '../controllers/ProfissionalController'
import { ItemCatalogoController } from '../controllers/ItemCatalogoController';
import { ClienteController } from '../controllers/ClienteController'
import { TransacaoController } from '../controllers/TransacaoController';

const routes = Router();
const profissionalController = new ProfissionalController();
const itemCatalogoController = new ItemCatalogoController();
const clienteController = new ClienteController();
const transacaoController = new TransacaoController();

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
routes.get('/transacao', transacaoController.listar);
routes.post('/transacao', transacaoController.criar);
routes.put('/transacao/:id', transacaoController.editar);
routes.delete('/transacao/:id', transacaoController.deletar);

export { routes };