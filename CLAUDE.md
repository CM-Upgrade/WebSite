# UpgradeMate – Landing Site

Bu repo, **UpgradeMate** ürününün pazarlama/tanıtım sitesini içerir.
UpgradeMate; kurumsal ortamlarda Windows OS yükseltmelerini yönetmek için ConfigMgr (SCCM) üzerine kurulan bir eklentidir.

Backend API ayrı bir repoda yaşar: `c:\Repos\upgrademate-api`

---

## Proje Yapısı

```
TestWebSite/
├── index.html          # Ana landing page
├── contact/
│   └── index.html      # İletişim formu
├── trynow/
│   └── index.html      # 10 günlük ücretsiz deneme talep formu
├── thank-you/
│   └── index.html      # Form sonrası yönlendirme sayfası
├── Assets/             # Görseller, ikonlar, GIF animasyonlar
└── _docs/              # Tasarım referansları ve marka kılavuzu
```

**Build süreci yoktur.** Site saf HTML/CSS/JS'den oluşur; framework, bundler veya package.json bulunmaz.

---

## Tasarım Sistemi

Tüm sayfalar ortak bir CSS değişken seti kullanır — bunları değiştirirken tüm sayfaları etkiler:

| Değişken         | Değer                     | Kullanım                  |
|------------------|---------------------------|---------------------------|
| `--bg`           | `#0F2033`                 | Sayfa arka planı          |
| `--bg-card`      | `#162D46`                 | Kart arka planı           |
| `--accent`       | `#0578D4`                 | Birincil aksan rengi      |
| `--accent-hover` | `#0668bb`                 | Hover durumu              |
| `--green`        | `#92C353`                 | Başarı / pozitif vurgu    |
| `--text-head`    | `#FFFFFF`                 | Başlıklar                 |
| `--text-body`    | `#A0B1C5`                 | Gövde metni               |
| `--text-muted`   | `#6b83a0`                 | İkincil / soluk metin     |
| `--border`       | `rgba(255,255,255,0.07)`  | Kart kenarlıkları         |

**Font:** Inter (Google Fonts'tan yüklenir)

**CSS mimarisi:** Ortak stiller `Assets/site.css`'te toplanmıştır. Her sayfanın inline `<style>` bloğu yalnızca o sayfaya özgü bileşenleri içerir. Yeni bir sayfa eklerken önce `site.css`'in ilgili sınıfı zaten kapsayıp kapsamadığını kontrol et; kapsamıyorsa önce oraya ekle.

---

## Sayfalar ve Sorumluluklukları

### `index.html` – Ana Landing Page
- Fixed glassmorphism navbar + hamburger mobil menü
- Hero: iki sütunlu grid (içerik + Dashboard.jpg görseli)
- "Why UpgradeMate?" — 3 kartlık grid (özellikler)
- "For Users" split bölümü — `Ani_ForUser.gif` ile
- "For IT Admins" split bölümü — `Ani_ForITAdmin.gif` ile (reverse yön)
- Fiyatlandırma — 3 kart (≤3.000, ≤10.000, >10.000 bilgisayar)
- Footer — logo, copyright, sosyal medya ikonları

### `contact/index.html` – İletişim Formu
- Alanlar: First Name, Last Name, Email, Company Name (opsiyonel), Message
- Cloudflare Turnstile CAPTCHA + honeypot bot koruması
- API: `POST /api/contact`
- Başarı/hata sonrası `../thank-you/?status=...&type=contact` yönlendirmesi

### `trynow/index.html` – Ücretsiz Deneme Formu
- Alanlar: First/Last Name, Email, Company, SCCM Site Code (3 karakter), SCCM Support ID, Client Count, Windows Version
- "?" butonlarıyla hover/tıklama popup yardım metinleri
- Cloudflare Turnstile CAPTCHA + honeypot
- API: `POST /api/trynow`
- 409 → `thank-you/?status=error&type=trial-exists` (aynı SCCM Support ID tekrar denemesi)
- 200 → `thank-you/?status=success&type=trynow`

### `thank-you/index.html` – Teşekkür Sayfası
- URL parametrelerine (`status`, `type`) göre dinamik içerik gösterir

---

## Backend API (`c:\Repos\upgrademate-api`)

Azure Functions (Node.js v3 programlama modeli) üzerinde çalışır.

| Endpoint       | Repo Dizini     | Açıklama                     |
|----------------|-----------------|------------------------------|
| `POST /api/contact` | `contact/`   | İletişim formu işleme        |
| `POST /api/trynow`  | `trynow/`    | Deneme talebi işleme         |

### Ortak akış (her iki endpoint)
1. OPTIONS preflight → 204
2. Honeypot (`_hp` alanı dolu) → sahte 200 (spambotları yanıltır)
3. Cloudflare Turnstile doğrulama (`_shared/turnstile.js`)
4. Alan doğrulama (sunucu tarafı)
5. Microsoft Graph API token al (`_shared/graphAuth.js`)
6. SharePoint listesine kaydet + bildirim e-postası gönder (paralel)

### `/api/trynow` ek kontrolü
- Aynı `sccmSupportId` daha önce kayıtlıysa → 409 döner
- `windowsVersion` değerleri: `26200` (Win 11 25H2) veya `26100` (Win 11 24H2)

### Ortam Değişkenleri (Azure App Service'te tanımlı)
```
TENANT_ID           – Microsoft Entra tenant ID
CLIENT_ID           – App registration client ID
CLIENT_SECRET       – App registration client secret
SHAREPOINT_SITE_ID  – SharePoint site ID
CONTACT_LIST_ID     – İletişim formu SharePoint listesi
TRYNOW_LIST_ID      – Deneme talebi SharePoint listesi
SENDER_EMAIL        – Mail gönderen hesap (Microsoft 365)
NOTIFICATION_EMAIL  – Bildirimlerin gideceği adres
ALLOWED_ORIGIN      – CORS izni (prod: https://upgrademate.io)
```

Yerel geliştirme için bu değişkenler `local.settings.json`'da tutulur (git'e commit edilmez).

---

## Form Güvenliği

Her iki form da iki katmanlı bot koruması kullanır:

1. **Honeypot:** `<input name="website">` gizli alanda; botlar doldurur, backend sahte 200 döner
2. **Cloudflare Turnstile:** Site key `0x4AAAAAAC0prEEJSRvXpHZo`, tema `dark`

Doğrulama hem istemci (JS) hem sunucu (Azure Function) tarafında yapılır.

---

## Yerel Geliştirme

### Frontend
Build adımı yoktur — HTML dosyalarını doğrudan tarayıcıda aç veya VS Code Live Server kullan.

### API (upgrademate-api)
```bash
cd c:/Repos/upgrademate-api
func start   # Azure Functions Core Tools gerektirir
```
Azurite blob/queue/table emulator dosyaları repo kökünde (`__azurite_db_*.json`, `__blobstorage__`, vb.) bulunur; bunlar lokal Azure Storage emülasyonu içindir.

---

## Dağıtım

- **Frontend:** Statik dosyalar (Azure Static Web Apps veya benzeri)
- **API:** Azure App Service — `https://upgrademate-api-eshge4a4ezapcmep.westeurope-01.azurewebsites.net`

---

## Önemli Kurallar

- CSS değişkenleri tüm sayfalarda inline `<style>` içinde tekrarlanır — bu kasıtlı bir tasarım kararıdır, ortak stylesheet'e çekme.
- Yeni bir sayfa eklerken mevcut sayfaların HTML/CSS yapısını kalıp olarak kullan.
- Asset yolları alt sayfalarda (`contact/`, `trynow/`, `thank-you/`) `../Assets/` ile başlar.
- Fiyatlandırma bilgisi değiştiğinde hem `index.html` hem `_docs/architecture/upgrademate-landing.md` güncellenmeli.
- API URL'lerini kod içinde değiştirme; `ALLOWED_ORIGIN` ortam değişkeni prod/local ayrımını sağlar.
