import type { VercelRequest, VercelResponse } from "@vercel/node";

const TAU_VIDEO_BASE = "https://tau-video.xyz";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { subtitleId } = req.query;
    const response = await fetch(`${TAU_VIDEO_BASE}/vtt/${subtitleId}`, {
      headers: {
        Referer: "https://tau-video.xyz/",
        Origin: "https://tau-video.xyz",
      },
    });
    const text = await response.text();
    res.setHeader("Content-Type", "text/vtt; charset=utf-8");
    res.send(text);
  } catch (err) {
    console.error("VTT error:", err);
    res.status(500).send("VTT error");
  }
}
