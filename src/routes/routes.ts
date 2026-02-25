import { Router } from 'express';
import { ProfissionalController } from '../controllers/ProfissionalController'

const routes = Router();
const profissionalController = new ProfissionalController();

// routes.post('/profissionais', profissionalController.create);
routes.get('/profissionais', profissionalController.listar);
// routes.delete('/profissionais/:id', profissionalController.deletar);

export { routes };