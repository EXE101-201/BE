import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import apiRoutes from './routes/index.js';


import { connectDB } from './config/db.js';

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api', apiRoutes);

const PORT = Number(process.env.PORT || 4000)

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 🔥 QUAN TRỌNG: đóng server khi tsx restart
const shutdown = () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

