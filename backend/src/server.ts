import { initDatabase } from './database/db';
import { createApp } from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

// Initialize database and start server
initDatabase()
  .then(() => {
    const app = createApp();
    app.listen(PORT, () => {
      logger.info(`Server started successfully on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });
    });
  })
  .catch((error) => {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
