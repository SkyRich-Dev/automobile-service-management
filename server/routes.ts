import type { Express } from "express";
import { type Server } from "http";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

const DJANGO_API_URL = process.env.DJANGO_API_URL || "http://localhost:8000";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Proxy all /api requests to Django backend
  app.use(
    "/api",
    createProxyMiddleware({
      target: DJANGO_API_URL,
      changeOrigin: true,
      pathRewrite: (path) => `/api${path}`,
      on: {
        error: (err, req, res: any) => {
          console.error("Proxy error:", err.message);
          if (res && res.writeHead) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Django backend unavailable" }));
          }
        },
        proxyReq: (proxyReq, req: any) => {
          // Forward cookies for session auth
          if (req.headers.cookie) {
            proxyReq.setHeader("Cookie", req.headers.cookie);
          }
          fixRequestBody(proxyReq, req);
        },
        proxyRes: (proxyRes, req, res) => {
          // Forward cookies from Django response
          const cookies = proxyRes.headers["set-cookie"];
          if (cookies) {
            res.setHeader("Set-Cookie", cookies);
          }
        },
      },
    })
  );

  return httpServer;
}
