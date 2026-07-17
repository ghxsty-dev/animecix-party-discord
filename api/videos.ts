import type { VercelRequest, VercelResponse } from "@vercel/node";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  Referer: "https://animecix.tv/",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { titleId, season, episode } = req.query;

    const url = `https://animecix.tv/secure/videos?titleId=${titleId}&season=${(season as string) || "1"}&episode=${(episode as string) || "1"}`;
    const r = await fetch(url, { headers: HEADERS });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("Videos error:", err);
    res.status(500).json({ error: "Videos failed" });
  }
}
