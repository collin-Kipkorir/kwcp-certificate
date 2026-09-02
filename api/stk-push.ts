import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

const PAYLOR_BASE = "https://api.paylorke.com/api/v1/merchants/payments";
const API_KEY = process.env.PAYLOR_API_KEY;
const DEFAULT_CHANNEL = process.env.PAYLOR_CHANNEL_ID;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (!API_KEY) {
      console.error("PAYLOR_API_KEY not set");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const payload = { ...(req.body || {}) };
    if (!payload.channelId && DEFAULT_CHANNEL) {
      payload.channelId = DEFAULT_CHANNEL;
    }

    const response = await fetch(`${PAYLOR_BASE}/stk-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    res.status(response.status).setHeader("Content-Type", "application/json").send(text);
  } catch (err) {
    console.error("stk-push proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  }
}
