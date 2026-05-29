import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes } from './routes/routes';
import { errorHandler } from './middleware/errorHandler';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: A variável de ambiente JWT_SECRET não está definida.');
  process.exit(1);
}

const app = express();

const allowedOrigins = [
  process.env.ADMIN_FRONTEND_URL,
  process.env.PORTAL_FRONTEND_URL
].filter(Boolean) as string[];

// CORS deve ser registrado antes de qualquer middleware que envie respostas (como rate limiters)
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

// Aplicar cabeçalhos de segurança Helmet
app.use(helmet());

// Rate Limiting Geral e Específico (com limites flexibilizados em desenvolvimento)
const isProd = process.env.NODE_ENV === 'production';

const limiterGeral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isProd ? 100 : 10000, // máximo de 10.000 requisições por IP em desenvolvimento
  message: { error: 'Muitas requisições originárias deste IP. Tente novamente mais tarde.' }
});

const limiterAutenticacao = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isProd ? 15 : 1000, // limite rígido somente em produção
  message: { error: 'Tentativas excessivas de autenticação. Bloqueado por 15 minutos.' }
});

app.use(limiterGeral);
app.use('/login', limiterAutenticacao);

app.use(express.json({ limit: '10kb' }));
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