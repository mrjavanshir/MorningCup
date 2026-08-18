# Səhər Fincanı ☕

Kiçik səhər oyunu: fincana 6 dəfə toxunub doldurursan, fincan dolanda buxar qalxır və günün "rəsmi" mesajı çıxır.

## Texnologiya

- React 19 + Vite 8
- Tailwind CSS 4 (`@tailwindcss/vite`)
- lucide-react (ikonlar)

## İşə salmaq

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # dist/
npm run preview  # build-i lokal yoxla
```

## Struktur

```
index.html          # şrift linkləri, favicon, meta
public/cup.svg      # favicon
src/main.jsx        # React entry
src/index.css       # Tailwind + qlobal stil
src/MorningCup.jsx  # oyunun bütün məntiqi və UI-ı
```

Mesajları dəyişmək üçün `src/MorningCup.jsx` içindəki `MESSAGES` massivinə əlavə et.
Fincanın neçə toxunuşa dolduğunu `STEPS` sabiti idarə edir.

## Deploy

`main`-ə hər push GitHub Actions ilə avtomatik GitHub Pages-ə deploy olunur
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

Canlı: https://mrjavanshir.github.io/MorningCup/

> `vite.config.js`-dəki `base: "/MorningCup/"` Pages-in alt-yol (subpath) URL-i üçündür.
> Repo adı dəyişsə, onu da dəyişmək lazımdır.
