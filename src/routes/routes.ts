import { Router } from 'express';
import { ProfissionalController } from '../controllers/ProfissionalController'
import { ItemCatalogoController } from '../controllers/ItemCatalogoController';

const routes = Router();
const profissionalController = new ProfissionalController();
const itemCatalogoController = new ItemCatalogoController();

// profissional
routes.get('/profissionais', profissionalController.listar);
routes.post('/profissionais', profissionalController.criar);
routes.put('/profissionais/:id', profissionalController.editar);
routes.delete('/profissionais/:id', profissionalController.deletar);

// item catalogo
routes.get('/itens', itemCatalogoController.listar);
routes.post('/itens', itemCatalogoController.criar);
routes.put('/itens/:id', itemCatalogoController.editar);
routes.delete('/itens/:id', itemCatalogoController.deletar);

export { routes };