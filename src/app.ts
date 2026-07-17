import * as animecix from "./animecix.js";
import { initPlayer } from "./player.js";

let currentView: "browse" | "search" | "detail" | "player" = "browse";
let selectedTitle: any = null;
let appEl: HTMLDivElement;

export function initApp(discordSdk: any, auth: any) {
  appEl = document.getElementById("app") as HTMLDivElement;
  appEl.innerHTML = "";

  renderNav();
  renderBrowse();
}

function renderNav() {
  const nav = document.createElement("div");
  nav.className = "nav";
  nav.innerHTML = `
    <div class="nav-brand">🎌 AnimeciX</div>
    <div class="nav-actions">
      <button class="btn btn-sm" id="nav-browse">Keşfet</button>
      <button class="btn btn-sm" id="nav-search">Ara</button>
    </div>
  `;
  appEl.appendChild(nav);

  nav.querySelector("#nav-browse")!.addEventListener("click", () => {
    currentView = "browse";
    renderBrowse();
  });
  nav.querySelector("#nav-search")!.addEventListener("click", () => {
    currentView = "search";
    renderSearch();
  });
}

function clearContent() {
  const existing = appEl.querySelector(".content");
  if (existing) existing.remove();
}

async function renderBrowse() {
  clearContent();
  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  appEl.appendChild(content);

  try {
    const { data } = await animecix.getLastEpisodes(1);
    content.innerHTML = `
      <h2 class="section-title">Son Eklenen Bölümler</h2>
      <div class="anime-grid" id="anime-grid"></div>
    `;
    const grid = content.querySelector("#anime-grid") as HTMLDivElement;

    data.slice(0, 18).forEach((ep: any) => {
      const card = document.createElement("div");
      card.className = "anime-card";
      card.innerHTML = `
        <div class="anime-poster">
          <img src="${ep.title_poster || "https://via.placeholder.com/200x300?text=Anime"}" alt="${ep.title_name}" loading="lazy" />
          <div class="anime-badge">S${ep.season_number}B${ep.episode_number}</div>
        </div>
        <div class="anime-info">
          <h3>${ep.title_name}</h3>
          <p>${ep.release_date}</p>
        </div>
      `;
      card.addEventListener("click", () => showDetail(ep.title_id));
      grid.appendChild(card);
    });
  } catch (err) {
    content.innerHTML = `<p class="error">Bölümler yüklenemedi.</p>`;
  }
}

function renderSearch() {
  clearContent();
  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = `
    <div class="search-box">
      <input type="text" id="search-input" placeholder="Anime ara..." autofocus />
      <button class="btn btn-primary" id="search-btn">Ara</button>
    </div>
    <div id="search-results"></div>
  `;
  appEl.appendChild(content);

  const input = content.querySelector("#search-input") as HTMLInputElement;
  const btn = content.querySelector("#search-btn") as HTMLButtonElement;
  const results = content.querySelector("#search-results") as HTMLDivElement;

  const doSearch = async () => {
    const query = input.value.trim();
    if (!query) return;

    results.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    try {
      const res = await animecix.searchAnime(query, 12);
      if (!res.results || res.results.length === 0) {
        results.innerHTML = `<p class="empty">Sonuç bulunamadı.</p>`;
        return;
      }

      results.innerHTML = `<div class="anime-grid" id="search-grid"></div>`;
      const grid = results.querySelector("#search-grid") as HTMLDivElement;

      res.results.forEach((t: any) => {
        const card = document.createElement("div");
        card.className = "anime-card";
        card.innerHTML = `
          <div class="anime-poster">
            <img src="${t.poster || "https://via.placeholder.com/200x300?text=Anime"}" alt="${t.name}" loading="lazy" />
            ${t.tmdb_vote_average ? `<div class="anime-rating">⭐ ${Number(t.tmdb_vote_average).toFixed(1)}</div>` : ""}
          </div>
          <div class="anime-info">
            <h3>${t.name_english || t.name}</h3>
            <p>${t.year || "?"} • ${t.episode_count || "?"} bölüm</p>
          </div>
        `;
        card.addEventListener("click", () => showDetail(t.id));
        grid.appendChild(card);
      });
    } catch (err) {
      results.innerHTML = `<p class="error">Arama sırasında hata oluştu.</p>`;
    }
  };

  btn.addEventListener("click", doSearch);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });
}

async function showDetail(titleId: number) {
  clearContent();
  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  appEl.appendChild(content);

  try {
    const { title } = await animecix.getTitleDetail(titleId);
    selectedTitle = title;

    content.innerHTML = `
      <div class="detail-page">
        <div class="detail-backdrop" style="background-image: url(${title.backdrop || ""})"></div>
        <div class="detail-content">
          <div class="detail-header">
            <img class="detail-poster" src="${title.poster || "https://via.placeholder.com/200x300?text=Anime"}" alt="${title.name}" />
            <div class="detail-info">
              <h1>${title.name_english || title.name}</h1>
              ${title.name ? `<p class="detail-alt-name">${title.name}</p>` : ""}
              <div class="detail-meta">
                ${title.year ? `<span>📅 ${title.year}</span>` : ""}
                ${title.tmdb_vote_average ? `<span>⭐ ${Number(title.tmdb_vote_average).toFixed(1)}</span>` : ""}
                ${title.episode_count ? `<span>📺 ${title.episode_count} bölüm</span>` : ""}
                ${title.season_count ? `<span>🎬 ${title.season_count} sezon</span>` : ""}
                ${title.runtime ? `<span>⏱️ ${title.runtime} dk</span>` : ""}
              </div>
              ${title.genres?.length ? `<div class="detail-genres">${title.genres.map((g: any) => `<span class="genre-tag">${g.display_name}</span>`).join("")}</div>` : ""}
              <p class="detail-desc">${title.description || "Açıklama yok."}</p>
              <div class="detail-actions">
                <button class="btn btn-primary btn-lg" id="play-btn">▶️ İzlemeye Başla</button>
                <select id="season-select" class="select"></select>
              </div>
            </div>
          </div>
          <div id="episodes-container"></div>
        </div>
      </div>
    `;

    if (title.seasons?.length) {
      const sel = content.querySelector("#season-select") as HTMLSelectElement;
      title.seasons.forEach((s: any) => {
        const opt = document.createElement("option");
        opt.value = s.number;
        opt.textContent = `Sezon ${s.number} (${s.episode_count} bölüm)`;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", () => loadEpisodes(titleId, Number(sel.value)));
    }

    loadEpisodes(titleId, 1);

    content.querySelector("#play-btn")!.addEventListener("click", () => {
      startPlayer(titleId, 1, 1);
    });
  } catch (err) {
    content.innerHTML = `<p class="error">Detaylar yüklenemedi.</p>`;
  }
}

async function loadEpisodes(titleId: number, season: number) {
  const container = document.getElementById("episodes-container");
  if (!container) return;

  container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

  try {
    const { title } = await animecix.getTitleDetail(titleId, season);
    const videos = title.videos || [];

    const epMap = new Map<number, any[]>();
    videos.forEach((v: any) => {
      const ep = v.episode_num;
      if (!epMap.has(ep)) epMap.set(ep, []);
      epMap.get(ep)!.push(v);
    });

    if (epMap.size === 0) {
      container.innerHTML = `<p class="empty">Bu sezonda bölüm bulunamadı.</p>`;
      return;
    }

    container.innerHTML = `<h2 class="section-title">Bölümler</h2><div class="episode-list" id="ep-list"></div>`;
    const list = container.querySelector("#ep-list") as HTMLDivElement;

    epMap.forEach((vids, ep) => {
      const fansubs = [...new Set(vids.map((v: any) => v.extra).filter(Boolean))].join(", ");
      const epCard = document.createElement("div");
      epCard.className = "episode-card";
      epCard.innerHTML = `
        <div class="ep-number">${ep}</div>
        <div class="ep-info">
          <h4>Bölüm ${ep}</h4>
          <p>${fansubs || "Bilinmeyen fansub"}</p>
        </div>
        <button class="btn btn-sm btn-primary ep-play-btn">▶️</button>
      `;
      epCard.querySelector(".ep-play-btn")!.addEventListener("click", () => {
        startPlayer(titleId, season, ep);
      });
      list.appendChild(epCard);
    });
  } catch (err) {
    container.innerHTML = `<p class="error">Bölümler yüklenemedi.</p>`;
  }
}

async function startPlayer(titleId: number, season: number, episode: number) {
  clearContent();
  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = `<div class="loading"><div class="spinner"></div><p>Stream yükleniyor...</p></div>`;
  appEl.appendChild(content);

  try {
    const videosResult = await animecix.getVideos(titleId, season, episode);
    const videos = videosResult.pagination.data;

    if (!videos || videos.length === 0) {
      content.innerHTML = `<p class="error">Video bulunamadı.</p>`;
      return;
    }

    const bestVideo = videos[0];
    const tau = await animecix.resolveTauStream(bestVideo.url, bestVideo.id);
    const streamUrl = animecix.getBestStreamUrl(tau);

    if (!streamUrl) {
      content.innerHTML = `<p class="error">Stream URL alınamadı.</p>`;
      return;
    }

    initPlayer(content, {
      streamUrl,
      title: selectedTitle?.name || "Anime",
      season,
      episode,
      poster: selectedTitle?.poster,
      duration: tau.duration,
      subtitles: tau.subs || [],
    });
  } catch (err) {
    console.error("Player hatası:", err);
    content.innerHTML = `<p class="error">Stream yüklenirken hata oluştu.</p>`;
  }
}
