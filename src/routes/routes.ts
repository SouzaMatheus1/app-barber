import { Router } from 'express';
import { ProfissionalController } from '../controllers/ProfissionalController'

const routes = Router();
const profissionalController = new ProfissionalController();

routes.get('/profissionais', profissionalController.listar);
routes.post('/profissionais', profissionalController.criar);
routes.put('/profissionais/:id', profissionalController.editar);
routes.delete('/profissionais/:id', profissionalController.deletar);

export { routes };