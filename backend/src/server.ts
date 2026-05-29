import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { routes } from './routes/routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

const allowedOrigins = [
  process.env.ADMIN_FRONTEND_URL,
  process.env.PORTAL_FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Acesso rejeitado por política CORS de produção.'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(routes);

app.get('/ping', (req, res) => {
  return res.json({ message: 'Servidor da Empresa (B2B) rodando perfeitamente! ✂️' });
});

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}/ping`);
});