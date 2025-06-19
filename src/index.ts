/**
 * Application entry point
 * Initializes and starts the server with proper error handling
 */

import dotenv from 'dotenv';
import { app } from './app';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = new Logger('Server');

/**
 * Start the application server
 */
function startServer(): void {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    
    logger.info('Starting Leasing Agreement Service', {
      environment: process.env.NODE_ENV || 'development',
      port
    });
    
    app.start(port);
    
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
