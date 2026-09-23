import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRoutes from './routes/ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// На Render запросы приходят через прокси: без этого req.ip — адрес прокси,
// и лимит AI-запросов становился общим на всех посетителей
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// API эндпоинты
app.use('/api/ai', aiRoutes);

// Раздача клиентских файлов платформы из ../client
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[JAVA-ZERO] Сервер запущен на http://localhost:${PORT}`);
});