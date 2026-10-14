import http from 'node:http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.mjs';
import { seedDatabase } from './seeds/seed.mjs';
import { setupSocketIO } from './sockets/index.mjs';

// Route modules
import authRouter from './routes/auth.mjs';
import usersRouter from './routes/users.mjs';
import clubsRouter from './routes/clubs.mjs';
import announcementsRouter from './routes/announcements.mjs';
import eventsRouter from './routes/events.mjs';
import projectsRouter from './routes/projects.mjs';
import communityRouter from './routes/community.mjs';
import messagesRouter from './routes/messages.mjs';
import notificationsRouter from './routes/notifications.mjs';
import timetableRouter from './routes/timetable.mjs';
import resourcesRouter from './routes/resources.mjs';
import servicesRouter from './routes/services.mjs';
import productsRouter from './routes/products.mjs';
import ordersRouter from './routes/orders.mjs';
import reportsRouter from './routes/reports.mjs';
import adminRouter from './routes/admin.mjs';
import searchRouter from './routes/search.mjs';
import { authenticate } from './middleware/auth.mjs';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 8787;

// Setup Socket.IO
const io = setupSocketIO(httpServer);
app.set('io', io);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim(), process.env.CLIENT_URL.trim().replace(/\/$/, '')] : [])
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/api', authenticate);

// Health check for Render and external monitors
app.get(['/', '/health', '/api/health', '/api/v1/health'], (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'Vynora Campus+ API'
  });
});

// Mount API v1 routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/clubs', clubsRouter);
app.use('/api/v1/announcements', announcementsRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/community', communityRouter);
app.use('/api/v1/conversations', messagesRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/timetable', timetableRouter);
app.use('/api/v1/resources', resourcesRouter);
app.use('/api/v1/campus-services', servicesRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/search', searchRouter);

// Backwards-compatible legacy route aliases
app.use('/api/auth', authRouter);
app.use('/api/timetable', timetableRouter);

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.',
    timestamp: new Date().toISOString()
  });
});

// Startup sequence: connect DB, seed baseline dataset, listen
async function startServer() {
  await connectDB();
  if (mongoose.connection.readyState === 1) {
    await seedDatabase().catch((err) => console.warn('[Seed Error]', err.message));
  } else {
    console.warn('[Seed Skipped] Database is not connected yet; skipping initial seed.');
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.info(`================================================`);
    console.info(` VYNORA CAMPUS+ SERVER RUNNING ON 0.0.0.0:${PORT}`);
    console.info(` API Base: http://0.0.0.0:${PORT}/api/v1`);
    console.info(` Socket.IO: ws://0.0.0.0:${PORT}`);
    console.info(`================================================`);
  });
}

startServer();
