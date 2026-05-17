require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(cors());
// express.json() removed because it breaks http-proxy-middleware for POST requests

let proxyTarget = process.env.RAG_API_URL || "http://localhost:8000";
if (!proxyTarget.startsWith("http")) {
  proxyTarget = "https://" + proxyTarget;
}

// RAG Service Proxy (Python FastAPI runs on port 8000)
app.use(
  "/api/rag",
  createProxyMiddleware({
    target: proxyTarget, // Python Service URL Configurable
    changeOrigin: true,
    pathRewrite: {
      "^/api/rag": "", // Strip /api/rag prefix when forwarding to Python
    },
    onError: (err, req, res) => {
      console.error("Proxy Error:", err);
      res.status(502).json({ error: "RAG Service Unavailable" });
    },
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "PrivaShield Backend Gateway Running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Gateway running on port ${PORT}`);
});
