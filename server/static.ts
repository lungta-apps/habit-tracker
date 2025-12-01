import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production, the server runs from 'dist', which is also where the client assets are.
  // __dirname will point to the 'dist' directory.
  const publicPath = __dirname;

  // Serve static assets (like JS, CSS) from the root of the public path
  app.use(express.static(publicPath));

  // For any other request, fall back to serving index.html.
  // This is crucial for single-page applications with client-side routing.
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}
