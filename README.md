# Sabahınız Xeyir ☀️

Ganira üçün kiçik oyunlar/sürprizlər toplusu — hələlik səhər mövzuludur, amma
zamanla başqa mövzularda oyunlar da əlavə olunacaq. Hər oyunun öz linki var —
göndərdiyin link birbaşa o oyunu açır, qarşı tərəf digər oyunları görmür.

- **Günəş** — toxunub günəşi qaldırırsan, doğanda günün mesajı çıxır
- **Daybreak** — sürüşdürüb günəşi üfüqdən qaldırırsan, gecədən gündüzə keçid
- **Agreement** — zarafatyana "rəsmi" saziş, bəndləri seç/əlavə et və möhürlə

## Necə işləyir (birbaşa link)

Ana səhifə (`/`) bilərəkdən boşdur — heç nə göstərmir, ona görə ki, kimsə
təsadüfən əsas URL-i açsa, bu layihənin nə olduğunu bilməsin. Menyu `/games`
yolundadır — hər oyunun yanındakı 🔗 düyməsi o oyunun linkini kopyalayır
(məs. `/games/sun`). Həmin linki açan şəxs menyunu görmür, birbaşa seçilmiş
oyuna düşür; oyun içində menyuya qayıtmaq üçün heç bir link yoxdur.

```
https://mrjavanshir.github.io/MorningCup/games/sun
```

> `/sun` (məs. `/MorningCup/sun`) də ayrıca dəstəklənir — bu, `/games`
> strukturundan əvvəl göndərilmiş köhnə link olduğu üçün qırılmamalıdır.
> Digər oyunlar üçün belə "çılpaq" (bare) yol yoxdur.

GitHub Pages statik host olduğu üçün bilinməyən yolları (`/games/sun` və s.)
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
index.html            # şrift linkləri, favicon, meta
public/sun.svg        # favicon
src/main.jsx          # React entry
src/index.css         # Tailwind + qlobal stil
src/App.jsx           # menyu, path-əsaslı yönləndirmə (/games, /games/<id>)
src/messages.js       # ortaq rəng palitrası + mesaj bankları
src/SunGame.jsx       # Günəş oyunu
src/DaybreakGame.jsx  # Daybreak oyunu
src/AgreementGame.jsx # Agreement oyunu
src/NoteResult.jsx    # ortaq nəticə kartı (Sun/Daybreak üçün)
```

Mesajları dəyişmək üçün `src/messages.js` içindəki müvafiq massivə əlavə et.
Yeni oyun əlavə etmək üçün `src/App.jsx`-dəki `GAMES` massivinə yeni giriş və
uyğun `id` ilə komponent əlavə et.

## Deploy

`main`-ə hər push GitHub Actions ilə avtomatik GitHub Pages-ə deploy olunur
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

Canlı: https://mrjavanshir.github.io/MorningCup/

> `vite.config.js`-dəki `base: "/MorningCup/"` Pages-in alt-yol (subpath)
> URL-idir və artıq göndərilmiş linklərin (məs. `/MorningCup/sun`) işləməyə
> davam etməsi üçün olduğu kimi saxlanılıb — repo adı və bu path bilərəkdən
> dəyişdirilmir.
