import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, createSessionLog, getSessionLogs, clearSessionLogs } from './src/db/helpers.ts';
import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // API 1: Health / DB Status Check
  app.get("/api/db-status", async (req, res) => {
    const isConfigured = !!(
      process.env.SQL_HOST &&
      process.env.SQL_DB_NAME &&
      process.env.SQL_USER &&
      process.env.SQL_PASSWORD
    );

    if (!isConfigured) {
      return res.json({
        status: "unconfigured",
        message: "Database environment variables are not yet configured.",
      });
    }

    try {
      // Test the query connection
      await db.select().from(users).limit(1);
      res.json({
        status: "connected",
        message: "Successfully connected to PostgreSQL database.",
      });
    } catch (error: any) {
      console.error("Database connection test failed:", error);
      res.json({
        status: "error",
        message: "Database environment variables are present but connection failed.",
        error: error.message,
      });
    }
  });

  // API 2: Authenticate and synchronize profile (creates session log)
  app.post("/api/login", requireAuth, async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized: Missing authentication metadata" });
    }

    try {
      const email = authUser.email || "no-email@firebase.com";
      const name = authUser.name || "Anonymous User";
      const picture = authUser.picture || "";

      // Upsert user profile (Caller Layer error handling)
      const dbUser = await getOrCreateUser(authUser.uid, email, name, picture);

      // Record successful session log
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string;
      const userAgent = req.headers['user-agent'] || 'Unknown Device';
      await createSessionLog(dbUser.id, ip, userAgent, 'success');

      // Fetch fresh session logs list
      const logs = await getSessionLogs(dbUser.id);

      res.json({
        message: "Login recorded successfully",
        user: dbUser,
        logs,
      });
    } catch (error: any) {
      console.error("Error during user synchronisation / session log:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API 3: Get user session logs and profile
  app.get("/api/profile", requireAuth, async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const email = authUser.email || "no-email@firebase.com";
      const name = authUser.name || "Anonymous User";
      const picture = authUser.picture || "";

      // Ensure user profile exists
      const dbUser = await getOrCreateUser(authUser.uid, email, name, picture);

      // Fetch logs
      const logs = await getSessionLogs(dbUser.id);

      res.json({
        user: dbUser,
        logs,
      });
    } catch (error: any) {
      console.error("Error retrieving user profile or logs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API 4: Clear user session logs
  app.delete("/api/session-logs", requireAuth, async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const email = authUser.email || "no-email@firebase.com";
      const dbUser = await getOrCreateUser(authUser.uid, email);

      await clearSessionLogs(dbUser.id);
      res.json({ message: "Session logs cleared successfully" });
    } catch (error: any) {
      console.error("Error clearing session logs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API 5: Simulate a new custom session log (for demonstration and interactive testing)
  app.post("/api/session-logs/simulate", requireAuth, async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { customDevice, customIp, status } = req.body;

    try {
      const email = authUser.email || "no-email@firebase.com";
      const dbUser = await getOrCreateUser(authUser.uid, email);

      // Record simulated session log
      const ip = customIp || (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string;
      const userAgent = customDevice || req.headers['user-agent'] || 'Simulated Device';
      await createSessionLog(dbUser.id, ip, userAgent, status || 'success');

      // Fetch fresh list
      const logs = await getSessionLogs(dbUser.id);

      res.json({
        message: "Simulated session log recorded",
        logs,
      });
    } catch (error: any) {
      console.error("Error simulating session log:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
