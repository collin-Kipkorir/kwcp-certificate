import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:8080";

app.use(cors({ origin: FRONTEND }));
app.use(express.json());

const PAYLOR_BASE = "https://api.paylorke.com/api/v1/merchants/payments";
const API_KEY = process.env.PAYLOR_API_KEY;
const DEFAULT_CHANNEL = process.env.PAYLOR_CHANNEL_ID;

if (!API_KEY) {
  console.warn("PAYLOR_API_KEY not set — proxy will fail until configured");
}

app.post("/api/stk-push", async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };
    if (!payload.channelId && DEFAULT_CHANNEL) payload.channelId = DEFAULT_CHANNEL;

    const r = await fetch(`${PAYLOR_BASE}/stk-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (err) {
    console.error("proxy stk-push error", err);
    res.status(500).json({ error: "proxy error" });
  }
});

app.get("/api/transactions/:txId", async (req, res) => {
  try {
    const txId = req.params.txId;
    const r = await fetch(`${PAYLOR_BASE}/transactions/${encodeURIComponent(txId)}`, {
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    });
    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (err) {
    console.error("proxy transaction query error", err);
    res.status(500).json({ error: "proxy error" });
  }
});

// Optional webhook endpoint receiver
// Webhook receiver with optional HMAC-SHA256 verification
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.PAYLOR_WEBHOOK_SECRET;
      const sig = req.headers["x-webhook-signature"] || req.headers["x-webhook-signature".toLowerCase()];
      if (secret && sig) {
        const hmac = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
        if (hmac !== sig) {
          console.warn("webhook signature mismatch", { expected: hmac, got: sig });
          return res.status(400).json({ error: "invalid signature" });
        }
      }
      const body = req.body && req.body.length ? JSON.parse(req.body.toString()) : {};
      console.log("webhook received", body);
      res.status(200).send({ ok: true });
    } catch (err) {
      console.error("webhook handler error", err);
      res.status(500).send({ error: "webhook handler error" });
    }
  },
);

app.listen(PORT, () => console.log(`Paylor proxy listening on http://localhost:${PORT}`));
