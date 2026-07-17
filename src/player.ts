interface PlayerOptions {
  streamUrl: string;
  title: string;
  season: number;
  episode: number;
  poster?: string;
  duration?: number;
  subtitles: { _id: string; language: string; name: string; url: string }[];
}

export function initPlayer(container: HTMLElement, opts: PlayerOptions) {
  container.innerHTML = `
    <div class="player-page">
      <div class="player-header">
        <button class="btn btn-sm" id="player-back">← Geri</button>
        <h3>${opts.title} - S${opts.season}B${opts.episode}</h3>
      </div>
      <div class="player-wrapper">
        <video id="video-player" controls autoplay>
          <source src="${opts.streamUrl}" type="video/mp4" />
          Tarayıcınız video oynatmayı desteklemiyor.
        </video>
      </div>
      <div class="player-controls">
        <div class="player-info">
          <span id="player-time">00:00 / 00:00</span>
          <span id="player-quality"></span>
        </div>
        ${opts.subtitles.length > 0 ? `
          <div class="subtitle-controls">
            <label>Altyazı:</label>
            <select id="subtitle-select" class="select">
              <option value="">Yok</option>
              ${opts.subtitles.map(s => `<option value="${s.url}">${s.language} - ${s.name}</option>`).join("")}
            </select>
          </div>
        ` : ""}
      </div>
    </div>
  `;

  const video = container.querySelector("#video-player") as HTMLVideoElement;
  const timeEl = container.querySelector("#player-time") as HTMLSpanElement;

  video.addEventListener("timeupdate", () => {
    const cur = formatTime(video.currentTime);
    const dur = formatTime(video.duration || 0);
    timeEl.textContent = `${cur} / ${dur}`;
  });

  const backBtn = container.querySelector("#player-back");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      video.pause();
      container.innerHTML = "";
    });
  }

  const subSelect = container.querySelector("#subtitle-select") as HTMLSelectElement | null;
  if (subSelect) {
    subSelect.addEventListener("change", () => {
      const existingTrack = video.querySelector("track");
      if (existingTrack) existingTrack.remove();

      if (subSelect.value) {
        const track = document.createElement("track");
        track.kind = "subtitles";
        track.src = `/api/tau/vtt/${subSelect.value}`;
        track.srclang = "tr";
        track.default = true;
        video.appendChild(track);
      }
    });
  }
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
