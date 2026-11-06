# pekmen.net

Pekmen'in portfolyosu. Astro ile kurulmuş, SSR olarak çalışan, üç dili kendi
URL'lerinde sunan bir site: İngilizce `/`, Türkçe `/tr/`, Almanca `/de/`.

Tasarım: İsviçre tipografisi, bej zemin ve zümrüt yeşili vurgular. Süsleme yok;
hiyerarşi ölçek, ağırlık ve çizgilerle kuruluyor.

## Başlarken

```bash
npm install
copy .env.example .env
npm run dev
```

Site `http://localhost:3000` adresinde açılır.

```bash
npm run build     # Cloudflare Workers çıktısı → dist/
npm run preview   # derlenmiş sürümü workerd üzerinde çalıştır
npm run deploy    # build + Cloudflare'e deploy
npm run check     # Astro + TypeScript kontrolü
npm test          # Google Calendar ve Resend taklitleriyle backend testleri
npm run google:auth  # Google Calendar refresh token üret
```

> Proje Node 22+ gerektirir. Geliştirme ve önizleme
> `http://localhost:3000` adresinde açılır. Üretim Cloudflare Workers
> üzerinde çalışır; gizli değişkenler `wrangler secret` veya Cloudflare
> panelinden girilir.

Windows'ta kısıtlı bir çalıştırıcı `esbuild` alt sürecini `spawn EPERM` ile
engellerse Astro, Vite üzerinden yapılandırmayı tekrar yükler. Bu ikinci deneme
`source-map-js` içinde `require is not defined` hatası verebilir. Teşhis için
`node --input-type=module -e "await import('@astrojs/cloudflare')"` komutunu
çalıştırın. `spawn EPERM` doğrulanırsa Astro komutlarını, `esbuild` ve yerel
önizlemede `workerd` alt süreçlerine izin veren bir terminalde çalıştırın.

### Yönetici oturumu

`ADMIN_PASSWORD` ile `ADMIN_SESSION_SECRET` ayrı secret değerleridir. Anahtarı
`node -p "require('node:crypto').randomBytes(32).toString('hex')"` ile üretin.
Yerel workerd için iki değeri `.dev.vars` içinde, üretim için Cloudflare
Worker secret ayarlarında tanımlayın. Yeni anahtar eksik veya geçersizse panel
girişe kapalı kalır. Eski çerezler yeni imza biçiminde geçerli değildir. Bu
sürüm yayımlandığında ve anahtar değiştirildiğinde tekrar giriş gerekir.

Admin POST istekleri tam origin ve oturuma bağlı, işlem bazlı CSRF belirteci
gerektirir. Varsayılan üretim origin'i `https://pekmen.net`. Staging için
`ADMIN_ORIGIN` değerini protokol ve varsa port dahil, son eğik çizgi olmadan
tanımlayın. Yerel loopback önizlemesi kendi origin'ini kullanır.

Girişteki IP sayacı Worker örneğinin belleğindedir. Sayaçlar örnekler arasında
paylaşılmaz ve örnek kapanınca sıfırlanır. Dağıtımda `/api/admin/login` için
Cloudflare WAF hız sınırı kuralını doğrulayın. Cloudflare Access kullanılacaksa
hem `/admin` hem `/api/admin/*` yollarını kapsayın.

### Randevu koordinatörü

`wrangler.jsonc` içindeki `BOOKING_COORDINATOR` binding'i, `src/worker.ts`
tarafından dışa aktarılan `BookingCoordinator` sınıfına bağlanır. İlk dağıtımda
Wrangler, `booking-coordinator-v1` migration'ıyla SQLite sınıfını oluşturur.
Migration ve Worker kodunu birlikte dağıtın. Sınıfı, migration etiketini veya
aynı takvim için kullanılan `GOOGLE_CALENDAR_ID` değerini değiştirmeyin.
`primary` kullanılıyorsa OAuth hesabının birincil takvimi aynı kalmalıdır.
Önceki koordinasyonsuz sürüme dönüş çift rezervasyon riskini yeniden açar.
Mevcut Google etkinlikleri yerinde kalır ve uygunluk sorgularında dikkate alınır.

Koordinatör yalnızca Worker binding'i üzerinden erişilebilir. Yazma niyeti,
hedef aralık ve varsa eski aralık Google isteğinden önce kaydedilir. Google
yazmasının sonucu belirsizse yeniden yazma yerine etkinlik kimliği, işlem
işareti ve saatler okunarak uzlaştırılır. Google'dan `404` gelmesi tek başına
yazmanın başarısız olduğunu kanıtlamaz. Uzlaştırılamayan aralıklar ilgili
görüşmelerin en geç bitişi ve tampon süresi dolana kadar korunur. Başarılı
işlemlerin tekrar kaydı aralık sona erdikten sonra 24 saat daha tutulur.
Google arayüzünden yapılan değişiklikler bu koordinasyona katılmaz.
Sonucu alarm ile doğrulanan işlemler e-postayı yeniden tetiklemez.

## Sayfalar

| Yol | İçerik |
| --- | --- |
| `/` | Hero, seçili işler, ilke, yaklaşım, iletişim |
| `/projects/` | Tüm projelerin indeksi |
| `/projects/[slug]/` | Proje detayı / vaka analizi (SSR, bilinmeyen slug → 404) |
| `/blog/` | Yazılar indeksi (üç dilli, en yeni üstte) |
| `/blog/[slug]/` | Yazı sayfası (SSR, bilinmeyen slug → 404) |
| `/contact/` | İletişim bilgileri ve form |
| `/appointment/` | Kendi randevu arayüzü + Google Calendar |
| `/privacy/` | Gizlilik metni (Google OAuth onayı için gerekli) |
| `/admin/` | Şifreli panel: onay bekleyen ve onaylı randevular |
| `/sitemap-index.xml` | Dinamik sitemap |
| `/api/contact` | İletişim formu (Resend) |
| `/api/booking` | Müsaitlik ve randevu talebi oluşturma (Google Calendar) |
| `/api/admin/login` | Panel girişi (şifre + imzalı çerez) |
| `/api/admin/confirm` | Randevuyu onaylama (katılımcıya davet + e-posta) |
| `/api/admin/reschedule` | Randevu tarih/saat değişikliği |
| `/api/admin/cancel` | Randevu iptali (Google Calendar) |
| `/api/admin/bookings` | Panel canlı takibi (imza, adet, onay bekleyen) |
| `/api/health` | E-posta ve takvim yapılandırma durumu |

Her sayfa üç adreste de açılır: `/projects/`, `/tr/projects/` ve
`/de/projects/`. İngilizce adresler prefikssizdir; `/en/...` adresleri
kanonik İngilizce adrese 301 ile yönlenir.

Bilinmeyen bir proje adresi `/404` sayfasını 404 durum koduyla döndürür.
Yazılar `src/data/posts.ts` içinde üç dilli olarak (başlık, özet, gövde)
tutuluyor; yeni yazı eklemek için diziye bir kayıt eklemek yeterli.

## Dil sistemi

Dil URL'den belirlenir ve sunucuda çözülür; istemci tarafında dil değiştirme
veya `localStorage` yoktur:

1. `/` ve prefikssiz tüm adresler İngilizce, `/tr/...` Türkçe, `/de/...`
   Almancadır.
2. `src/middleware.ts` dil prefiksini okur, `Astro.locals.lang` içine yazar ve
   isteği prefikssiz sayfaya rewrite eder. Tarayıcıdaki adres değişmez.
3. Dil değiştirici (`LangSwitch`) aynı sayfanın diğer dildeki adresine normal
   bağlantı verir; böylece sayfa yeniden, doğru dilde render edilir.
4. `<html lang>`, başlık, açıklama, canonical ve `hreflang` etiketleri seçilen
   dile göre sunucuda üretilir.

Çevrilebilir her metin `<L10n>` bileşeniyle yazılır:

```astro
<L10n en="Selected work" tr="Seçili işler" de="Ausgewählte Arbeiten" />
```

Bileşen, aktif dili `langOf(Astro)` ile bulur ve yalnızca o dilin metnini
render eder. İçerik HTML içeriyorsa `html` prop'u kullanılabilir. İç bağlantılar
`localePath(lang, "/projects")` ile kurulur; böylece dil sayfalar arasında
korunur.

## İçerik güncelleme

- **Projeler:** `src/data/projects.ts`. Her proje üç dilde özet, açıklama,
  bölümler ve metrikler içerir. Sıra dosyadaki sıradır; `index`, `year`, `tags`,
  `live` alanları serbestçe güncellenebilir.
- **Site bilgileri:** `src/data/site.ts` — e-posta, konum, sosyal bağlantılar.
- **Sayfa metinleri:** ilgili `.astro` dosyasındaki `<L10n>` bileşenleri.
- **Renkler ve tipografi:** `src/styles/global.css` içindeki `:root` değişkenleri.
- **Görsel kimlik:** `public/favicon.svg`, `public/og.png`,
  `public/apple-touch-icon.png`.
- **Proje görselleri:** `public/projects/*.webp` 1200×675 kaynaktır; aynı adla
  `-480`, `-800`, `-960` varyantları da repoda tutulur. Yeni görsel eklerken
  üç küçük varyantı üretin; `imageSrcSet()` bunları `srcset` olarak kullanır.

> Şu anki proje metinleri ve profil bilgileri **geçici**dir. Nihai içerik
> geldiğinde `src/data/projects.ts` ve `src/data/site.ts` güncellenecek.

## İletişim formu (Resend)

Form, `POST /api/contact` route'una JSON gönderir. Route, Resend HTTP API'si
üzerinden e-posta yollar; API anahtarı istemciye hiçbir zaman gönderilmez.

1. [resend.com](https://resend.com) hesabı aç.
2. **Domains → Add Domain** ile `pekmen.net` ekle ve DNS kayıtlarını doğrula.
3. **API Keys → Create API Key** ile bir anahtar oluştur.
4. `.env` dosyasına ekle:

   ```bash
   RESEND_API_KEY=re_xxxxxxxxx
   CONTACT_TO=contact@pekmen.net
   CONTACT_FROM=Pekmen <contact@pekmen.net>
   ```

5. Sunucuyu yeniden başlat.

`RESEND_API_KEY` boşsa API `503 not_configured` döner ve form, ziyaretçinin
e-posta uygulamasını `mailto:` ile açar. Formda honeypot, sunucu tarafı
doğrulama ve IP bazlı hız sınırı vardır.

> Resend'in ücretsiz planı ayda 3.000 e-posta (günde 100) içerir. Test
> aşamasında `onboarding@resend.dev` yalnızca Resend hesabınızın e-postasına
> gönderim yapabilir; kendi alan adınızı doğrulamanız gerekir.

## Randevu (Google Calendar)

Randevu sistemi tamamen bu projenin içinde. `GET /api/booking?action=availability&date=YYYY-MM-DD`
müsait saatleri döner. `POST /api/booking` yeni bir **talep** oluşturur: saat
takvimde hemen rezerve edilir, Google Meet linki üretilir ve katılımcıya
“talebiniz alındı” e-postası gider. Katılımcı, panelden onaylanana kadar
takvim daveti almaz.

### 1. Google Cloud

1. [Google Cloud Console](https://console.cloud.google.com/) üzerinde bir proje aç.
2. **APIs & Services → Library → Google Calendar API** servisini etkinleştir.
3. **OAuth consent screen** oluştur:
   - User type: **External** (kişisel Gmail) veya **Internal** (Workspace).
   - Scope ekle: `https://www.googleapis.com/auth/calendar`.
   - Test kullanıcısı olarak kendi adresini ekle.
4. Uygulamayı **Publishing status → In production** yap. Aksi hâlde test
   modundaki refresh token'lar 7 gün sonra süresi dolar. Doğrulanmamış uygulama
   uyarısını kendi hesabınız için kabul edebilirsiniz.
5. **Credentials → Create credentials → OAuth client ID → Web application**
   seç. Authorised redirect URI olarak şunu ekle:

   ```text
   http://localhost:53682/callback
   ```

6. Client ID ve secret'ı `.env` dosyasına yaz:

   ```bash
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_CALENDAR_ID=primary
   ```

### 2. Refresh token

```bash
npm run google:auth
```

Tarayıcı açılır, Google hesabınla izin verirsin. Terminalde basılan
`GOOGLE_REFRESH_TOKEN=...` satırını `.env` dosyasına ekle ve sunucuyu yeniden
başlat. Token gizlidir; repoya commit edilmez.

### 3. Randevu kuralları

`.env` içinde isteğe bağlı olarak ayarlanır:

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `BOOKING_TIMEZONE` | `Europe/Istanbul` | Takvim saat dilimi |
| `BOOKING_DURATION_MINUTES` | `30` | Görüşme süresi |
| `BOOKING_WORK_START` | `10` | İlk saat (yerel) |
| `BOOKING_WORK_END` | `18` | Son bitiş saati |
| `BOOKING_STEP_MINUTES` | `30` | Slot aralığı |
| `BOOKING_BUFFER_MINUTES` | `10` | Etkinlikler arası tampon |
| `BOOKING_LEAD_HOURS` | `24` | En erken kaç saat sonrası |
| `BOOKING_HORIZON_DAYS` | `60` | En fazla kaç gün ileri |
| `BOOKING_WORK_DAYS` | `1,2,3,4,5` | Çalışma günleri (0=Pazar) |

Google anahtarları yoksa randevu sayfası “e-posta ile istek” moduna düşer;
seçilen gün/saat bir `mailto:` taslağına yazılır ve canlı senkronizasyon
iddia edilmez.

### API sözleşmesi

```http
GET /api/booking?action=month&month=2026-11
→ { "ok": true, "month": "2026-11", "timezone": "Europe/Istanbul", "days": [{ "date": "2026-11-03", "count": 16 }] }

GET /api/booking?action=availability&date=2026-11-03
→ { "ok": true, "date": "...", "timezone": "Europe/Istanbul", "slots": [{ "start": "...", "label": "10:00" }] }

POST /api/booking
{ "action": "book", "name": "...", "email": "...", "note": "...", "start": "2026-11-03T10:00:00+03:00", "lang": "tr" }
→ { "ok": true, "event": { "start": "...", "end": "...", "htmlLink": "...", "meetLink": "...", "status": "pending" } }
```

`lang` alanı (`en`, `tr`, `de`) katılımcıya gidecek e-postaların dilini belirler.
`status` yeni taleplerde her zaman `pending` olur; onay panelden yapılır.

Hatalar `{ "ok": false, "error": "slot_taken" }` biçiminde döner. Olası kodlar:
`invalid_details`, `invalid_slot`, `slot_taken`, `not_configured`,
`rate_limited`, `google_auth`, `google_error`, `server_error`.

## Panel

`/admin/` adresi, Google takvimine yazılan randevu taleplerini listeler.
Panel yalnızca bu site üzerinden oluşturulan etkinlikleri gösterir (etkinlikler
`pekmen=booking` özel özelliğiyle işaretlenir). Bu özelliği taşımayan eski
kayıtlar da açıklamasındaki `Booked via pekmen.net` ya da başlığındaki `Call — `
önekinden tanınır. Panel bugünden **365 gün** ileriye bakar. Üstteki sayaçlar
yaklaşan, onay bekleyen ve sıradaki randevuyu gösterir.

Panel açıkken **10 saniyede bir** `/api/admin/bookings` sorgulanır. Yeni talep,
onay, tarih değişikliği veya iptal olduğunda imza değişir ve sayfa kendini
yeniler; veri aynıysa hiçbir şey yapılmaz. Açık bir “Tarihi değiştir” paneli
veya odaklanmış bir form varsa yenileme durur, böylece yazılanlar kaybolmaz.
Sağ üstteki **Canlı** göstergesi bu takibi gösterir.

Her kayıt için üç işlem vardır:

- **Onayla:** Katılımcıyı etkinliğe ekler, Google takvim davetini gönderir
  (`sendUpdates=all`) ve markalı bir onay e-postası yollar. Onaylanan kayıt
  “Onaylandı” rozetini alır.
- **Tarihi değiştir:** Aynı gün veya başka bir gün için boş saat seçilir.
  Katılımcıya eski ve yeni saati gösteren bir e-posta gider; isteğe bağlı not
  eklenebilir. Onaylı randevularda Google takvimi de güncellenir.
- **İptal et:** Etkinliği siler (`sendUpdates=all`) ve katılımcıya iptal
  e-postası gönderir.

Her kayıtta **Takvim** bağlantısı etkinliği Google Calendar’da açar; çakışma
kontrolü ve elle düzenleme için kullanılır.

Her eylemden sonra panelde sonuç bildirimi çıkar. E-posta gönderilemezse
işlem yine tamamlanır; panel katılımcıya elle haber verilmesi gerektiğini
belirtir. Katılımcı e-postaları rezervasyon sırasında seçilen dilde yazılır;
sahibine giden bildirim İngilizcedir ve panel bağlantısı içerir.

`.env` dosyasına bir şifre ekleyin:

```dotenv
ADMIN_PASSWORD=uzun-bir-sifre
```

- Giriş, `ADMIN_PASSWORD` ile HMAC imzalı, `HttpOnly` bir çerez üretir; oturum
  12 saat sürer. Şifre yoksa panel “Kurulum gerekli” ekranında kalır.
- Giriş denemeleri IP başına 5 dakikada 10 ile sınırlanır. Sayaç Workers
  örnekleri arasında paylaşılmadığı için bu yalnızca kaba bir fren; asıl koruma
  Cloudflare Access ve WAF rate limiting kuralıdır (aşağıya bakın).
- Panel `noindex` ve sitemap dışındadır; yanıtları `Cache-Control: no-store`
  ile gönderilir.

## Güvenlik

- **Başlıklar:** `src/middleware.ts` her yanıta HSTS, `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP ve
  `frame-ancestors 'none'` içeren bir CSP ekler.
- **CSP:** `astro.config.mjs` içindeki `security.csp`, satır içi betik ve stil
  dosyalarını build sırasında hash'ler; `'unsafe-inline'` gerekmez. Cloudflare
  beacon'ı edge'de eklendiği için `static.cloudflareinsights.com` kaynak
  listesinde durur.
- **İstemci IP'si:** yalnızca `CF-Connecting-IP` (yoksa platformun verdiği adres)
  kullanılır. `X-Forwarded-For` bilinçli olarak yok sayılır; ilk değeri istemci
  yazabildiği için rate limit'ler bu başlıkla atlatılabiliyordu.
- **Formlar:** honeypot alanı, gövde boyutu sınırı, e-posta başlığında satır
  sonu temizliği ve IP başına rate limit. İletişim formu gelen adı e-posta
  konusuna yazmadan önce kontrol karakterlerini siler.
- **Panel:** `SameSite=Lax` + `HttpOnly` çerez, imzalı oturum, aynı-köken ve
  `Sec-Fetch-Site` kontrolü. `/admin` ve `/api/*` yanıtları indekslenmez ve
  önbelleğe alınmaz.
- **Bilgi sızıntısı:** `/api/health` ve `/api/booking?action=ping` yalnızca
  `{ ok: true }` döner; hangi anahtarların tanımlı olduğunu açıklamaz.
- **Bildirim:** `/.well-known/security.txt` iletişim adresini yayınlar.

Dağıtımdan sonra kontrol:

```powershell
curl.exe -sI https://pekmen.net/ | Select-String -Pattern 'strict-transport|x-frame|referrer|permissions|content-security'
curl.exe -sI https://pekmen.net/admin | Select-String -Pattern 'cache-control|x-robots'
```

## Tasarım sistemi

- **Renkler:** bej zemin `--cream #f5f2eb`, zümrüt vurgu `--green #004f36`,
  metin `--ink #001c13`, çizgiler `--line #e6e2d8`.
- **Tipografi:** Inter Tight Variable, 100–900. Büyük başlıklarda
  `line-height: 1.15`, `letter-spacing: -0.02em`; gövdede 1.5–1.65 satır
  yüksekliği.
- **Grid:** 12 kolon, `--container: 1560px`, `--gutter` ile akışkan boşluk.
- **Hareket:** yalnızca durum noktası ve hover geçişleri; `prefers-reduced-motion`
  desteklenir.
- **Erişilebilirlik:** atlama bağlantısı, görünür odak halkaları, ARIA durumları,
  klavye ile kapanan mobil menü, anlamlı başlık sırası.

## Yapı

```
public/                 favicon, og, robots
scripts/google-oauth.mjs  tek seferlik Google OAuth yardımcısı
src/
  components/           header, footer, L10n, kartlar, formlar, scheduler
  data/                 site bilgileri ve projeler
  i18n/                 dil tipleri, locale yardımcıları ve yol üretimi
  layouts/BaseLayout    meta, JSON-LD, tema
  middleware.ts         dil prefiksi → rewrite, eski URL yönlendirmeleri
  pages/                rotalar
  pages/api/            contact, booking, health
  server/               env, Google Calendar, Resend, doğrulama, hız sınırı
  styles/global.css     tasarım sistemi
```

## SEO

- Canonical, Open Graph ve Twitter kartları her sayfada; her dil için ayrı
  canonical ve `og:locale`.
- `hreflang` alternatifleri (`en`, `tr`, `de`, `x-default`) her sayfada.
- Dinamik `sitemap-index.xml`: üç dildeki tüm adresler ve `xhtml:link`
  alternatifleri.
- `robots.txt`, JSON-LD `Person` şeması.
- `og.png` 1200×630.

Yayına aldıktan sonra Google Search Console'a `https://pekmen.net/sitemap-index.xml`
adresini gönder.

## Dağıtım

Site SSR olduğu için Cloudflare Workers üzerinde çalışır. Adapter
`@astrojs/cloudflare`; yapılandırma `wrangler.jsonc` içinde.

```bash
npm run build     # dist/ üretir
npm run preview   # workerd üzerinde yerel önizleme
npm run deploy    # build + wrangler deploy
```

İlk kurulumda gizli değişkenleri yükle:

```bash
npx wrangler secret bulk .env
```

veya Cloudflare panelinde **Settings → Variables and Secrets** altına gir.
`.env` ve `.dev.vars` repoya commit edilmez; üretim build'inde bundle'a da
gömülmez, değerler Workers runtime'ından okunur.

GitHub üzerinden otomatik deploy için Cloudflare panelinde
**Workers & Pages → Create → Workers → Connect to Git** ile `pekmen-net`
Worker'ını repoya bağla:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- `NODE_VERSION=22`

`pekmen.net` alan adını Worker'a **Custom Domain** olarak ekle. Eski Vercel
projesini yeni sürüm doğrulanana kadar silme.

> Cloudflare Pages bu adapter sürümüyle desteklenmiyor; Workers kullanılmalı.

Ortam değişkenleri (`RESEND_API_KEY`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`,
`ADMIN_PASSWORD`) Cloudflare secret olarak girilmelidir. Hiçbiri `PUBLIC_`
ön ekli değildir; istemciye sızmaz.
