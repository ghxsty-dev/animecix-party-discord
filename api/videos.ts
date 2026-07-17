import type { VercelRequest, VercelResponse } from "@vercel/node";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { titleId, season, episode } = req.query;
    const url = `https://animecix.tv/secure/videos?titleId=${titleId}&season=${(season as string) || "1"}&episode=${(episode as string) || "1"}`;
    const r = await fetch(url, { headers: HEADERS, redirect: "follow" });
    const text = await r.text();

    if (!r.ok) {
      console.error(`Animecix ${r.status}: ${text.slice(0, 500)}`);
      return res.status(r.status).json({ error: `Animecix ${r.status}`, body: text.slice(0, 300) });
    }

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch {
      res.status(500).json({ error: "Invalid JSON", body: text.slice(0, 300) });
    }
  } catch (err: any) {
    console.error("Videos error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
