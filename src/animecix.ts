const API_BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

export async function searchAnime(query: string, limit = 12) {
  return apiFetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function getTitleDetail(titleId: number, season = 1) {
  return apiFetch(`/api/title/${titleId}?season=${season}`);
}

export async function getVideos(titleId: number, season = 1, episode = 1) {
  return apiFetch(`/api/videos?titleId=${titleId}&season=${season}&episode=${episode}`);
}

export async function getLastEpisodes(page = 1) {
  return apiFetch(`/api/last-episodes?page=${page}`);
}

export async function resolveTauStream(embedUrl: string, videoId: number) {
  const match = embedUrl.match(/tau-video\.xyz\/embed\/([^?]+)/);
  if (!match) throw new Error("Geçersiz embed URL");
  return apiFetch(`/api/tau-video?embedId=${match[1]}&vid=${videoId}`);
}

export function getBestStreamUrl(tau: any): string | null {
  if (!tau.urls || tau.urls.length === 0) return null;
  const sorted = [...tau.urls].sort(
    (a: any, b: any) => (parseInt(b.label) || 0) - (parseInt(a.label) || 0)
  );
  return sorted[0].url;
}
