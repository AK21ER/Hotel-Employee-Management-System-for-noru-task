import dotenv from 'dotenv';
import { createApp } from './app.js';
import prisma from './lib/prisma.js';

dotenv.config();

const port = process.env.PORT || 5000;
const app = createApp();

const server = app.listen(port, () => {
  console.log(`=========================================`);
  console.log(`🏨 Hotel HRMS Backend Server running`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`📖 Swagger API Docs: http://localhost:${port}/api-docs`);
  console.log(`=========================================`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server and DB connections');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server and DB connections');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
