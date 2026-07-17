import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { embedId } = req.query;
    const vid = req.query.vid;

    const url = `https://tau-video.xyz/api/video/${embedId}${vid ? `?vid=${vid}` : ""}`;
    const r = await fetch(url, {
      headers: {
        Referer: "https://tau-video.xyz/",
        Origin: "https://tau-video.xyz",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("Tau error:", err);
    res.status(500).json({ error: "Tau failed" });
  }
}
