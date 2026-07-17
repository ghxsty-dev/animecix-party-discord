const ANIMECIX_BASE = "https://animecix.tv";
const TAU_VIDEO_BASE = "https://tau-video.xyz";
const TAU_VERSION = "1.1.6";
const XEH_KEY = "i4C7R2fXGocdYgFLzCbDlsJjukf8G58b";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  Referer: "https://animecix.tv/",
};

function generateXEH(version: string, queryString: string): string {
  const plaintext = `${version}${queryString}`;
  const key = new TextEncoder().encode(XEH_KEY);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  return crypto.subtle
    .importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt"])
    .then((cryptoKey) =>
      crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, new TextEncoder().encode(plaintext))
    )
    .then((encrypted) => {
      const ciphertext = new Uint8Array(encrypted);
      const tag = ciphertext.slice(-16);
      const data = ciphertext.slice(0, -16);
      const payload = new Uint8Array(data.length + tag.length);
      payload.set(data, 0);
      payload.set(tag, data.length);
      const b64 = btoa(String.fromCharCode(...payload));
      const ivB64 = btoa(String.fromCharCode(...iv));
      return `${b64}.${ivB64}`;
    });
}

async function secureFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const xeh = await generateXEH(TAU_VERSION, qs.replace(/^\?/, ""));

  const res = await fetch(`/api/proxy${path}${qs}`, {
    headers: { ...HEADERS, "X-E-H": xeh },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function searchAnime(query: string, limit = 12) {
  return secureFetch<any>(`/secure/search/${encodeURIComponent(query)}`, {
    type: "undefined",
    limit: String(limit),
    provider: "null",
  });
}

export async function getTitleDetail(titleId: number, season = 1) {
  return secureFetch<any>(`/secure/titles/${titleId}`, {
    seasonNumber: String(season),
  });
}

export async function getVideos(titleId: number, season = 1, episode = 1) {
  return secureFetch<any>("/secure/videos", {
    titleId: String(titleId),
    season: String(season),
    episode: String(episode),
  });
}

export async function getLastEpisodes(page = 1) {
  return secureFetch<any>("/secure/last-episodes", { page: String(page) });
}

export async function resolveTauStream(embedUrl: string, videoId: number) {
  const match = embedUrl.match(/tau-video\.xyz\/embed\/([^?]+)/);
  if (!match) throw new Error("Geçersiz embed URL");
  const embedId = match[1];

  const res = await fetch(`/api/tau/video/${embedId}?vid=${videoId}`);
  if (!res.ok) throw new Error(`Tau API error: ${res.status}`);
  return res.json() as Promise<any>;
}

export function getBestStreamUrl(tau: any): string | null {
  if (!tau.urls || tau.urls.length === 0) return null;
  const sorted = [...tau.urls].sort(
    (a: any, b: any) => (parseInt(b.label) || 0) - (parseInt(a.label) || 0)
  );
  return sorted[0].url;
}
