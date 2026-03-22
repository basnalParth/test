import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import expenseRoutes from './routes/expenses';

dotenv.config();

const app = express();

// CORS configuration - allow all cross-origin requests
app.use(
  cors({
    origin: (origin, callback) => callback(null, origin || '*'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: '*',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
