// dev-server.ts
import http from 'http';
import app from './api/index'; // Import the main app from our Vercel-compatible entrypoint
import { setupVite } from './api/vite'; // The Vite setup is still needed for dev

async function startDevServer() {
  const httpServer = http.createServer(app);

  // The original server/index.ts had dev-specific logic to setup Vite.
  // We add that back here for local development.
  await setupVite(httpServer, app);

  const port = parseInt(process.env.PORT || "5000", 10);

  httpServer.listen(port, "127.0.0.1", () => {
    console.log(`🚀 Dev server started at http://localhost:${port}`);
  });
}

startDevServer();
