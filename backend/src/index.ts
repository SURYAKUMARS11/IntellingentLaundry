import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { seedDatabase } from './seed';

// Routes imports
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import serviceRoutes from './routes/serviceRoutes';
import itemRoutes from './routes/itemRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reportRoutes from './routes/reportRoutes';
import settingRoutes from './routes/settingRoutes';
import expenseRoutes from './routes/expenseRoutes';
import categoryRoutes from './routes/categoryRoutes';
import backupRoutes from './routes/backupRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base API health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'CleanWave Laundry Shop API Server is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/garment-categories', categoryRoutes);
app.use('/api/backup', backupRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Start Server & Initialize Database
const startServer = async () => {
  try {
    const isDBConnected = await connectDB();
    if (isDBConnected) {
      await seedDatabase();
    }
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` 🧺 INTELLIGENTLAUNDRY SHOP BACKEND IS RUNNING!`);
      console.log(` 🚀 Listening on: http://localhost:${PORT}`);
      console.log(` 📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
