import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import HttpError from './utils/HttpError.js';
import authRoutes from './routes/authRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import { getDatabaseStatus } from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
    credentials: true,
  }),
);
app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use((request, _response, next) => {
  const changesState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  const origin = request.get('origin');
  if (changesState && (!origin || !allowedOrigins.includes(origin))) {
    return next(new HttpError(403, 'A trusted browser origin is required for this request.'));
  }
  return next();
});
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', contentRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'wdc-learning-portal-api',
    database: getDatabaseStatus(),
  });
});

app.get('/api/health/ready', (_request, response) => {
  const database = getDatabaseStatus();
  const ready = database === 'connected' || !process.env.MONGODB_URI;

  response.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    database,
  });
});

app.use((_request, _response, next) => next(new HttpError(404, 'Route not found.')));
app.use(errorHandler);

export default app;
