import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { routes } from './routes/routes';
import { portalRoutes } from './routes/portal.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes); // Se quiser separar ou jogar direto em /
app.use(routes); // Compatibilidade legado
app.use(portalRoutes);

app.get('/ping', (req, res) => {
  return res.json({ message: 'Servidor da Barbearia rodando perfeitamente! ✂️' });
});

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}/ping`);
});