import express from "express";
import cors from "cors";
import { createCipheriv, randomBytes } from "crypto";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const ANIMECIX_BASE = "https://animecix.tv";
const TAU_VIDEO_BASE = "https://tau-video.xyz";
const TAU_VERSION = "1.1.6";
const XEH_KEY = "i4C7R2fXGocdYgFLzCbDlsJjukf8G58b";

const COMMON_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  Referer: "https://animecix.tv/",
};

function generateXEH(queryString: string): string {
  const plaintext = `${TAU_VERSION}${queryString}`;
  const key = Buffer.from(XEH_KEY, "utf-8");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([encrypted, tag]);
  return `${payload.toString("base64")}.${iv.toString("base64")}`;
}

async function animecixFetch(path: string, params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const xeh = generateXEH(qs.replace(/^\?/, ""));

  const url = `${ANIMECIX_BASE}${path}${qs}`;
  console.log(`[Animecix] ${url}`);

  const res = await fetch(url, {
    headers: { ...COMMON_HEADERS, "X-E-H": xeh },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Animecix] ${res.status}: ${text.slice(0, 200)}`);
    throw new Error(`Animecix API error: ${res.status}`);
  }

  return res.json();
}

// Anime Search
app.get("/api/search", async (req, res) => {
  try {
    const q = req.query.q as string;
    const limit = (req.query.limit as string) || "12";
    const data = await animecixFetch(
      `/secure/search/${encodeURIComponent(q)}`,
      { type: "undefined", limit, provider: "null" }
    );
    res.json(data);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Arama hatası" });
  }
});

// Title Detail
app.get("/api/title/:id", async (req, res) => {
  try {
    const titleId = req.params.id;
    const season = (req.query.season as string) || "1";
    const data = await animecixFetch(`/secure/titles/${titleId}`, {
      seasonNumber: season,
    });
    res.json(data);
  } catch (err) {
    console.error("Title error:", err);
    res.status(500).json({ error: "Detay hatası" });
  }
});

// Videos
app.get("/api/videos", async (req, res) => {
  try {
    const { titleId, season, episode } = req.query;
    const data = await animecixFetch("/secure/videos", {
      titleId: titleId as string,
      season: (season as string) || "1",
      episode: (episode as string) || "1",
    });
    res.json(data);
  } catch (err) {
    console.error("Videos error:", err);
    res.status(500).json({ error: "Video hatası" });
  }
});

// Last Episodes
app.get("/api/last-episodes", async (req, res) => {
  try {
    const page = (req.query.page as string) || "1";
    const data = await animecixFetch("/secure/last-episodes", { page });
    res.json(data);
  } catch (err) {
    console.error("Last episodes error:", err);
    res.status(500).json({ error: "Son bölümler hatası" });
  }
});

// Tau Video Stream
app.get("/api/tau/video/:embedId", async (req, res) => {
  try {
    const { embedId } = req.params;
    const vid = req.query.vid;
    const url = `${TAU_VIDEO_BASE}/api/video/${embedId}${vid ? `?vid=${vid}` : ""}`;

    const response = await fetch(url, {
      headers: {
        Referer: "https://tau-video.xyz/",
        Origin: "https://tau-video.xyz",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Tau error:", err);
    res.status(500).json({ error: "Tau Video hatası" });
  }
});

// Tau VTT Subtitles
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
    console.error("VTT error:", err);
    res.status(500).send("VTT error");
  }
});

app.listen(PORT, () => {
  console.log(`🌐 AnimeciX proxy: http://localhost:${PORT}`);
});
