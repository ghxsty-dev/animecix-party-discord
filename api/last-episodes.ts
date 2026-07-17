import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCipheriv, randomBytes } from "crypto";

const ANIMECIX_BASE = "https://animecix.tv";
const TAU_VERSION = "1.1.6";
const XEH_KEY = "i4C7R2fXGocdYgFLzCbDlsJjukf8G58b";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  Referer: "https://animecix.tv/",
  "sec-ch-ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
};

function generateXEH(queryString: string): string {
  const plaintext = `${TAU_VERSION}${queryString}`;
  const key = Buffer.from(XEH_KEY, "utf-8");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([encrypted, tag]);
  return `${payload.toString("base64")}.${iv.toString("base64")}`;
}

async function safeFetch(url: string, qs: string): Promise<any> {
  const xeh = generateXEH(qs);
  const r = await fetch(url, {
    headers: { ...HEADERS, "X-E-H": xeh },
    redirect: "follow",
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const page = (req.query.page as string) || "1";
    const qs = `page=${page}`;
    const data = await safeFetch(`${ANIMECIX_BASE}/secure/last-episodes?${qs}`, qs);
    res.json(data);
  } catch (err: any) {
    console.error("Last episodes error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
