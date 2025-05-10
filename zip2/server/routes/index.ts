// server/routes/index.ts

import type { Express } from 'express';
import users from './users'; // Make sure users.ts exists in the same folder

export async function registerRoutes(app: Express) {
  app.use('/api/users', users);

  // Return the HTTP server for Vite or static setup
  const http = await import('http');
  const server = http.createServer(app);
  return server;
}
