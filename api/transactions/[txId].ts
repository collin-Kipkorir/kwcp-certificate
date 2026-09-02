import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

const PAYLOR_BASE = "https://api.paylorke.com/api/v1/merchants/payments";
const API_KEY = process.env.PAYLOR_API_KEY;

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

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    if (!API_KEY) {
      console.error("PAYLOR_API_KEY not set");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const { txId } = req.query;

    if (!txId || typeof txId !== "string") {
      return res.status(400).json({
        message: "Invalid request",
        error: {
          code: "VALIDATION_ERROR",
          message: "Transaction ID is required",
        },
      });
    }

    const response = await fetch(
      `${PAYLOR_BASE}/transactions/${encodeURIComponent(txId)}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

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
      return res.status(response.status).json({
        message: errorData.message || errorData.error?.message || "Transaction query failed",
        error: errorData.error || {
          code: "UNKNOWN_ERROR",
          message: "An error occurred while querying the transaction",
        },
      });
    }

    res.status(response.status).setHeader("Content-Type", "application/json").json(responseBody);
  } catch (err) {
    console.error("Transaction query proxy error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong on the server. Please try again.",
      },
    });
  }
}
