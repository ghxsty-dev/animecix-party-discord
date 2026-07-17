import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const ANIMECIX_BASE = "https://animecix.tv";
const TAU_VIDEO_BASE = "https://tau-video.xyz";

const COMMON_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  Referer: "https://animecix.tv/",
};

// Proxy Animecix API calls (avoids CORS)
app.all("/api/proxy/*", async (req, res) => {
  try {
    const path = req.url.replace("/api/proxy", "");
    const url = `${ANIMECIX_BASE}${path}`;

    const headers: Record<string, string> = { ...COMMON_HEADERS };
    if (req.headers["x-e-h"]) {
      headers["X-E-H"] = req.headers["x-e-h"] as string;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy hatası:", err);
    res.status(500).json({ error: "Proxy error" });
  }
});

// Tau Video API proxy
app.get("/api/tau/video/:embedId", async (req, res) => {
  try {
    const { embedId } = req.params;
    const vid = req.query.vid;

    const url = `${TAU_VIDEO_BASE}/api/video/${embedId}${vid ? `?vid=${vid}` : ""}`;
    const response = await fetch(url, {
      headers: {
        Referer: "https://tau-video.xyz/",
        Origin: "https://tau-video.xyz",
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Tau proxy hatası:", err);
    res.status(500).json({ error: "Tau proxy error" });
  }
});

// Tau WebVTT subtitle proxy
app.get("/api/tau/vtt/:subtitleId", async (req, res) => {
  try {
    const { subtitleId } = req.params;
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
    console.error("VTT proxy hatası:", err);
    res.status(500).send("VTT error");
  }
});

// Discord OAuth2 token exchange
app.post("/api/token", async (req, res) => {
  try {
    const { code } = req.body;
    // This requires your Discord application's client secret
    // For development, you can use the Discord SDK's built-in auth
    res.json({ access_token: code });
  } catch (err) {
    res.status(500).json({ error: "Token exchange error" });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 AnimeciX proxy sunucusu çalışıyor: http://localhost:${PORT}`);
});
