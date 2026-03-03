import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { routes } from './routes/routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

app.get('/ping', (req, res) => {
  return res.json({ message: 'Servidor da Barbearia rodando perfeitamente! ✂️' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}/ping`);
});