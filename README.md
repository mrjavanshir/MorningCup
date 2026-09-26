# Sabahınız Xeyir ☀️

Ganira üçün kiçik tətbiqlər/sürprizlər toplusu — hələlik səhər mövzuludur, amma
zamanla başqa mövzularda tətbiqlər də əlavə olunacaq. Hər tətbiqin öz linki var —
göndərdiyin link birbaşa o tətbiqi açır, qarşı tərəf digər tətbiqləri görmür.

- **Günəş** — toxunub günəşi qaldırırsan, doğanda günün mesajı çıxır
- **Daybreak** — sürüşdürüb günəşi üfüqdən qaldırırsan, gecədən gündüzə keçid
- **Agreement** — zarafatyana "rəsmi" saziş, bəndləri seç/əlavə et və möhürlə

## Necə işləyir (birbaşa link)

Ana səhifə (`/`) bilərəkdən boşdur — heç nə göstərmir, ona görə ki, kimsə
təsadüfən əsas URL-i açsa, bu layihənin nə olduğunu bilməsin. Menyu `/apps`
yolundadır — hər tətbiqin yanındakı 🔗 düyməsi o tətbiqin linkini kopyalayır
(məs. `/apps/sun`). Həmin linki açan şəxs menyunu görmür, birbaşa seçilmiş
tətbiqə düşür; tətbiq içində menyuya qayıtmaq üçün heç bir link yoxdur.

```
https://mrjavanshir.github.io/MorningCup/apps/sun
```

> Köhnə `/games/...` linkləri də işləyir — açılanda ünvan avtomatik
> `/apps/...`-ə keçir. `/sun` (məs. `/MorningCup/sun`) də ayrıca dəstəklənir —
> bu, menyu strukturundan əvvəl göndərilmiş ən köhnə linkdir. Digər tətbiqlər
> üçün belə "çılpaq" (bare) yol yoxdur.

GitHub Pages statik host olduğu üçün bilinməyən yolları (`/apps/sun` və s.)
tanımır. Bunun üçün `npm run build` bitəndə `dist/index.html` faylı
`dist/404.html`-ə köçürülür — Pages naməlum yol üçün 404 səhifəsini
qaytarır, o da eyni React app-ı yükləyib düzgün tətbiqi göstərir.

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
src/App.jsx           # menyu, path-əsaslı yönləndirmə (/apps, /apps/<id>)
src/messages.js       # ortaq rəng palitrası + mesaj bankları
src/SunApp.jsx        # Günəş tətbiqi
src/DaybreakApp.jsx   # Daybreak tətbiqi
src/AgreementApp.jsx  # Agreement tətbiqi
src/NoteResult.jsx    # ortaq nəticə kartı (Sun/Daybreak üçün)
```

Mesajları dəyişmək üçün `src/messages.js` içindəki müvafiq massivə əlavə et.
Yeni tətbiq əlavə etmək üçün `src/App.jsx`-dəki `APPS` massivinə yeni giriş və
uyğun `id` ilə komponent əlavə et.

## Deploy

`main`-ə hər push GitHub Actions ilə avtomatik GitHub Pages-ə deploy olunur
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

Canlı: https://mrjavanshir.github.io/MorningCup/

> `vite.config.js`-dəki `base: "/MorningCup/"` Pages-in alt-yol (subpath)
> URL-idir və artıq göndərilmiş linklərin (məs. `/MorningCup/sun`) işləməyə
> davam etməsi üçün olduğu kimi saxlanılıb — repo adı və bu path bilərəkdən
> dəyişdirilmir.
