export async function searchAnime(query: string, limit = 12) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) throw new Error(`Search error: ${res.status}`);
  return res.json();
}

export async function getTitleDetail(titleId: number, season = 1) {
  const res = await fetch(`/api/title?id=${titleId}&season=${season}`);
  if (!res.ok) throw new Error(`Title error: ${res.status}`);
  return res.json();
}

export async function getVideos(titleId: number, season = 1, episode = 1) {
  const res = await fetch(`/api/videos?titleId=${titleId}&season=${season}&episode=${episode}`);
  if (!res.ok) throw new Error(`Videos error: ${res.status}`);
  return res.json();
}

export async function getLastEpisodes(page = 1) {
  const res = await fetch(`/api/last-episodes?page=${page}`);
  if (!res.ok) throw new Error(`Last episodes error: ${res.status}`);
  return res.json();
}

export async function resolveTauStream(embedUrl: string, videoId: number) {
  const match = embedUrl.match(/tau-video\.xyz\/embed\/([^?]+)/);
  if (!match) throw new Error("Geçersiz embed URL");

  const res = await fetch(`/api/tau-video?embedId=${match[1]}&vid=${videoId}`);
  if (!res.ok) throw new Error(`Tau error: ${res.status}`);
  return res.json();
}

export function getBestStreamUrl(tau: any): string | null {
  if (!tau.urls || tau.urls.length === 0) return null;
  const sorted = [...tau.urls].sort(
    (a: any, b: any) => (parseInt(b.label) || 0) - (parseInt(a.label) || 0)
  );
  return sorted[0].url;
}
