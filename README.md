# AnimeciX Discord Activity

Discord sesli kanallarında birlikte anime izleme etkinliği.

## Özellikler

- 🎌 AnimeciX API entegrasyonu
- 🔍 Anime arama ve keşfetme
- ▶️ Gömülü video oynatıcı
- 📺 Altyazı desteği
- 🎉 Sesli kanalda senkron izleme

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

`dist/` klasörünü Vercel, Netlify veya herhangi bir static hosting'e deploy edin.

## Discord Yapılandırması

1. [Discord Developer Portal](https://discord.com/developers/applications) → Uygulama oluştur
2. Activities → Build Your Own seç
3. Root Mapping: Barındırma URL'niz (örn: `https://your-app.vercel.app`)
4. `VITE_DISCORD_CLIENT_ID`'yi `.env`'ye ekleyin
