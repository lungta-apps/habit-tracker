import express, { type Express } from "express";
import fs from "fs";
import path from "path";

import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const publicPath = __dirname;

  app.use(express.static(publicPath));

  app.use("*", (req, res) => {
    const indexPath = path.resolve(publicPath, "index.html");
    
    try {
      const filesInDir = fs.readdirSync(publicPath);
      res.status(500).json({
          message: "DEBUG: Vercel pathing issue. Attempting to find index.html.",
          triedPath: indexPath,
          public_path: publicPath,
          dirname: __dirname,
          cwd: process.cwd(),
          files_in_public_path: filesInDir,
          url_requested: req.originalUrl
      });
    } catch (e: any) {
      res.status(500).json({
        message: "DEBUG: Error reading publicPath.",
        error: e.message,
        public_path: publicPath,
        dirname: __dirname,
        cwd: process.cwd(),
      });
    }
  });
}
