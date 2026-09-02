import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

const PAYLOR_BASE = "https://api.paylorke.com/api/v1/merchants/payments";
const API_KEY = process.env.PAYLOR_API_KEY;
const DEFAULT_CHANNEL = process.env.PAYLOR_CHANNEL_ID;
const PAYLOR_WEBHOOK_SECRET = process.env.PAYLOR_WEBHOOK_SECRET;

interface PaylorError {
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{
      path?: string;
      message?: string;
      code?: string;
    }>;
  };
}

function formatErrorResponse(statusCode: number, paylorError: PaylorError) {
  const code = paylorError.error?.code || "UNKNOWN_ERROR";
  const message = paylorError.error?.message || paylorError.message || "Request failed";
  const details = paylorError.error?.details || [];

  return {
    statusCode,
    message,
    error: {
      code,
      message,
      details,
    },
  };
}

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
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Idempotency-Key, X-Idempotency-Key"
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

    // Validate required fields
    if (!payload.phone) {
      return res.status(400).json({
        message: "Invalid request payload",
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details: [{ path: "phone", message: "phone is required", code: "custom" }],
        },
      });
    }

    if (!payload.amount) {
      return res.status(400).json({
        message: "Invalid request payload",
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details: [{ path: "amount", message: "amount is required", code: "custom" }],
        },
      });
    }

    if (!payload.reference) {
      return res.status(400).json({
        message: "Invalid request payload",
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details: [{ path: "reference", message: "reference is required", code: "custom" }],
        },
      });
    }

    // Add default channel if not provided
    if (!payload.channelId && DEFAULT_CHANNEL) {
      payload.channelId = DEFAULT_CHANNEL;
    }

    // Build headers with idempotency support
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    };

    // Support both Idempotency-Key and X-Idempotency-Key from client
    const idempotencyKey = req.headers["idempotency-key"] || req.headers["x-idempotency-key"];
    if (idempotencyKey && typeof idempotencyKey === "string") {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    const response = await fetch(`${PAYLOR_BASE}/stk-push`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    // Parse response
    let responseBody: unknown;
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = text;
    }

    // Handle Paylor errors with structured response
    if (!response.ok) {
      const errorData = responseBody as PaylorError;
      const formatted = formatErrorResponse(response.status, errorData);
      return res.status(response.status).json(formatted.error);
    }

    res.status(response.status).setHeader("Content-Type", "application/json").json(responseBody);
  } catch (err) {
    console.error("stk-push proxy error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong on the server. Please try again.",
      },
    });
  }
}
