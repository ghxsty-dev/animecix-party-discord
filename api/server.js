const express = require("express");
const cors = require("cors");
const { createCipheriv, randomBytes } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const ANIMECIX_BASE = "https://animecix.tv";
const TAU_VIDEO_BASE = "https://tau-video.xyz";
const TAU_VERSION = "1.1.6";
const XEH_KEY = "i4C7R2fXGocdYgFLzCbDlsJjukf8G58b";

const HEADERS = {
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

function generateXEH(queryString) {
  const plaintext = `${TAU_VERSION}${queryString}`;
  const key = Buffer.from(XEH_KEY, "utf-8");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([encrypted, tag]);
  return `${payload.toString("base64")}.${iv.toString("base64")}`;
}

async function animecixFetch(path, params) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const xeh = generateXEH(qs.replace(/^\?/, ""));
  const url = `${ANIMECIX_BASE}${path}${qs}`;
  console.log(`[API] ${url}`);

  const res = await fetch(url, {
    headers: { ...HEADERS, "X-E-H": xeh },
    redirect: "follow",
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[API] ${res.status}: ${text.slice(0, 200)}`);
    throw new Error(`Animecix ${res.status}`);
  }
  return JSON.parse(text);
}

// Search
app.get("/api/search", async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q) return res.status(400).json({ error: "q required" });
    const data = await animecixFetch(`/secure/search/${encodeURIComponent(q)}`, {
      type: "undefined",
      limit: limit || "12",
      provider: "null",
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Title Detail
app.get("/api/title/:id", async (req, res) => {
  try {
    const data = await animecixFetch(`/secure/titles/${req.params.id}`, {
      seasonNumber: req.query.season || "1",
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Videos
app.get("/api/videos", async (req, res) => {
  try {
    const { titleId, season, episode } = req.query;
    const data = await animecixFetch("/secure/videos", {
      titleId,
      season: season || "1",
      episode: episode || "1",
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Last Episodes
app.get("/api/last-episodes", async (req, res) => {
  try {
    const data = await animecixFetch("/secure/last-episodes", {
      page: req.query.page || "1",
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tau Video Stream
app.get("/api/tau-video", async (req, res) => {
  try {
    const { embedId, vid } = req.query;
    const url = `${TAU_VIDEO_BASE}/api/video/${embedId}${vid ? `?vid=${vid}` : ""}`;
    const r = await fetch(url, {
      headers: {
        Referer: "https://tau-video.xyz/",
        Origin: "https://tau-video.xyz",
      },
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tau VTT Subtitles
app.get("/api/tau-vtt/:subtitleId", async (req, res) => {
  try {
    const r = await fetch(`${TAU_VIDEO_BASE}/vtt/${req.params.subtitleId}`, {
      headers: {
        Referer: "https://tau-video.xyz/",
        Origin: "https://tau-video.xyz",
      },
    });
    const text = await r.text();
    res.setHeader("Content-Type", "text/vtt; charset=utf-8");
    res.send(text);
  } catch (err) {
    res.status(500).send("VTT error");
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Animecix API proxy: http://localhost:${PORT}`);
});
