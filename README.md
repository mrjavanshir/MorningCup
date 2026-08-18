# Sabahınız Xeyir ☀️

Kiçik səhər oyunları toplusu. Hər oyunun öz linki var — göndərdiyin link birbaşa
o oyunu açır, qarşı tərəf digər oyunları görmür.

- **Fincan** — toxunub fincanı doldurursan, dolanda buxar qalxır və günün mesajı çıxır
- **Günəş** — toxunub günəşi qaldırırsan, doğanda günün mesajı çıxır

## Necə işləyir (birbaşa link)

Ana səhifədə (`/`) menyu görünür — hər oyunun yanındakı 🔗 düyməsi o oyunun
linkini kopyalayır (`/cup` və ya `/sun`). Həmin linki açan şəxs menyunu
görmür, birbaşa seçilmiş oyuna düşür; oyun içində menyuya qayıtmaq üçün heç
bir link yoxdur.

```
https://mrjavanshir.github.io/MorningCup/sun
```

GitHub Pages statik host olduğu üçün bilinməyən yolları (`/cup`, `/sun`)
tanımır. Bunun üçün `npm run build` bitəndə `dist/index.html` faylı
`dist/404.html`-ə köçürülür — Pages naməlum yol üçün 404 səhifəsini
qaytarır, o da eyni React app-ı yükləyib düzgün oyunu göstərir.

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
public/cup.svg       # favicon
src/main.jsx         # React entry
src/index.css        # Tailwind + qlobal stil
src/App.jsx           # menyu, link yönləndirməsi (?game=)
src/messages.js       # ortaq rəng palitrası + mesaj bankı
src/CupGame.jsx        # Fincan oyunu
src/SunGame.jsx        # Günəş oyunu
src/NoteResult.jsx      # ortaq nəticə kartı
```

Mesajları dəyişmək üçün `src/messages.js` içindəki `MESSAGES` massivinə əlavə et.
Yeni oyun əlavə etmək üçün `src/App.jsx`-dəki `GAMES` massivinə yeni giriş və
uyğun `id` ilə komponent əlavə et.

## Deploy

`main`-ə hər push GitHub Actions ilə avtomatik GitHub Pages-ə deploy olunur
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

Canlı: https://mrjavanshir.github.io/MorningCup/

> `vite.config.js`-dəki `base: "/MorningCup/"` Pages-in alt-yol (subpath) URL-i üçündür.
> Repo adı dəyişsə, onu da dəyişmək lazımdır.
