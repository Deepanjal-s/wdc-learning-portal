import 'dotenv/config';
import { createServer } from 'node:http';
import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const port = Number(process.env.PORT) || 5000;
const server = createServer(app);

async function startServer() {
  try {
    await connectDatabase();
    server.listen(port, () => {
      console.log(`WDC Learning Portal API listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down gracefully.`);
  server.close(async (error) => {
    if (error) {
      console.error('Failed to close HTTP server cleanly:', error.message);
      process.exitCode = 1;
    }

    try {
      await disconnectDatabase();
    } catch (disconnectError) {
      console.error('Failed to disconnect from MongoDB:', disconnectError.message);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
