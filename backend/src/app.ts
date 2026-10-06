import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorMiddleware);

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

export default app;
