# UpgradeMate – Landing Site

Bu repo, **UpgradeMate** ürününün pazarlama/tanıtım sitesini içerir.
UpgradeMate; kurumsal ortamlarda Windows OS yükseltmelerini yönetmek için ConfigMgr (SCCM) üzerine kurulan bir eklentidir.

Backend API ayrı bir repoda yaşar: `c:\Repos\upgrademate-api`

---

## Proje Yapısı

```
WebSite/
├── index.html              # Ana landing page
├── contact/
│   └── index.html          # İletişim formu
├── trynow/
│   └── index.html          # 10 günlük ücretsiz deneme talep formu
├── thank-you/
│   └── index.html          # Form sonrası yönlendirme sayfası
├── checkout/
│   └── index.html          # Plan seçimi + faturalama + iyzico ödeme başlatma
├── payment/
│   └── index.html          # iyzico checkout form embed
├── payment-result/
│   └── index.html          # Ödeme sonucu (başarı/hata) + lisans bilgisi
├── privacy/
│   └── index.html          # Privacy Policy (GDPR + KVKK)
├── delivery-returns/
│   └── index.html          # Delivery & Returns Policy
├── terms/
│   └── index.html          # Terms of Use
├── Assets/                 # Görseller, ikonlar, GIF animasyonlar, site.css
└── CNAME
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

## Sayfalar ve Sorumlulukları

### `index.html` – Ana Landing Page
- Fixed glassmorphism navbar + hamburger mobil menü
- Hero: iki sütunlu grid (içerik + Dashboard.jpg görseli)
- "Why UpgradeMate?" — 3 kartlık grid (özellikler)
- "For Users" split bölümü — `Ani_ForUser.gif` ile
- "For IT Admins" split bölümü — `Ani_ForITAdmin.gif` ile (reverse yön)
- Fiyatlandırma — 3 kart (≤3.000 → $990, ≤10.000 → $1.990, >10.000 → $2.990, her biri per Site/year)
- Footer (aşağıda detaylandırıldı)

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

### `checkout/index.html` – Plan Seçimi + Ödeme Başlatma
- "Choose Your Plan" tag başlığı + 3 plan kartı (anasayfadaki pricing section ile birebir görünüm; "Most Popular" rozeti yok, tüm kartlar aynı accent border)
- Sol: Personal Information + Site Information (SCCM Site Code/Support ID/Client Count/Windows Version) + Billing Information
- Sağ: Sticky **Order Summary** kartı — plan özeti, Türkiye için TCMB kuruyla TRY fiyat + KDV %20, diğer ülkeler için USD + "VAT exempt"
- Order Summary kartının en altında **iyzico + Visa + Mastercard** logo bandı (`Assets/Ico_PaymentBand.png`, kart genişliğinin %60'ı)
- Placeholder kullanılmaz, sadece label gösterilir
- Country = Turkey → Tax Office + Tax Number zorunlu
- Country ≠ Turkey → VAT ID (opsiyonel)
- Invoice Type = Corporate → Company Title + Corporate Tax Number (ikisi de zorunlu)
- Company alanı opsiyonel (label'da "(optional)")
- API: `POST /api/payment-init` → `checkoutFormContent` döner → `sessionStorage`'a yazılır, `/payment/` sayfasına yönlendirilir

### `payment/index.html` – iyzico Form Embed
- `sessionStorage`'daki `checkoutFormContent` değerini alıp iyzico form HTML'ini sayfaya gömer
- Üstte adım göstergesi (1. Details ✓ / 2. Payment / 3. Confirmation) ve order-strip (plan/fiyat özeti + "Edit" linki)
- Altta güvenlik bandı (256-bit SSL · PCI DSS Level 1 · Powered by iyzico)
- Ödeme sonrası iyzico `callbackUrl`'e POST atar → backend kullanıcıyı `/payment-result/` sayfasına yönlendirir

### `payment-result/index.html` – Ödeme Sonucu
- URL parametreleri: `status` (`success`/`error`), `plan`, `msg` (hata açıklaması)
- Başarıda: lisans anahtarının e-postayla gönderildiğini bildirir, "Setup Guide" + "Back to Home" butonları
- Hatada: hata mesajı + "Try Again" (checkout'a) + "Contact Support" butonları

### `privacy/index.html` – Privacy Policy
- GDPR + KVKK uyumlu 4 bölüm (Collection, Storage, Rights, Miscellaneous)
- Ödeme sağlayıcısı "a licensed payment service provider" olarak geçer (iyzico ismi verilmez; bu iyzico'nun kendi politikasıyla uyumludur)
- Veri saklama: faturalar için 10 yıl (Türk Vergi Usul Kanunu m.253)
- İletişim: `info@upgrademate.io`

### `delivery-returns/index.html` – Delivery & Returns Policy
- Teslimat: 24 saat içinde e-posta ile dijital lisans + indirme linki
- İade: Dijital ürün olduğu için lisans teslim edildikten sonra iade kabul edilmez (cayma hakkı feragati açıkça belirtilir)
- Ücretsiz 10 günlük deneme önerisi (trynow sayfasına link)
- İletişim: `info@upgrademate.io`

### `terms/index.html` – Terms of Use
- 10 bölüm: License Grant, Restrictions, Ownership, Fees/Refunds, Warranty, Limitation of Liability, Term/Termination, Changes, Governing Law, Contact
- Yönetim hukuku: **Türkiye Cumhuriyeti** + İstanbul mahkemeleri
- Sorumluluk sınırı: son 12 ayın ücret toplamı
- İletişim: `info@upgrademate.io`

---

## Footer (tüm sayfalarda ortak)

Tek satırlı yapı:
- **Sol:** UpgradeMate logosu + "© 2026 UpgradeMate. All rights reserved."
- **Sağ:** Privacy Policy · Delivery & Returns · Terms of Use + sosyal ikonlar (X, YouTube, LinkedIn)
- 800px altında dikey stack olur (mobilde)

Footer stilleri `site.css` → `.footer-brand`, `.footer-meta`, `.footer-legal`, `.footer-links`. Yeni bir sayfa eklerken mevcut sayfalardan footer markup'ını kopyala.

---

## Backend API (`c:\Repos\upgrademate-api`)

Azure Functions (Node.js v3 programlama modeli) üzerinde çalışır.

| Endpoint                     | Repo Dizini        | Açıklama                                  |
|------------------------------|--------------------|-------------------------------------------|
| `POST /api/contact`          | `contact/`         | İletişim formu işleme                     |
| `POST /api/trynow`           | `trynow/`          | Deneme talebi işleme                      |
| `GET  /api/exchange-rate`    | `exchange-rate/`   | TCMB günlük USD/TRY kuru (frontend için)  |
| `POST /api/payment-init`     | `payment-init/`    | iyzico Checkout Form başlatma             |
| `POST /api/payment-callback` | `payment-callback/`| iyzico'nun POST ettiği callback           |
| `POST /api/webhook`          | `webhook/`         | iyzico webhook (iade vb. olaylar)         |

### Ortak form akışı (contact + trynow)
1. OPTIONS preflight → 204
2. Honeypot (`_hp` alanı dolu) → sahte 200 (spambotları yanıltır)
3. Cloudflare Turnstile doğrulama (`_shared/turnstile.js`)
4. Alan doğrulama (sunucu tarafı)
5. Microsoft Graph API token al (`_shared/graphAuth.js`)
6. SharePoint listesine kaydet + bildirim e-postası gönder (paralel)

### Ödeme akışı
1. Frontend `/checkout/` → plan + billing bilgileriyle `POST /api/payment-init`
2. Backend iyzico'da Checkout Form başlatır → `checkoutFormContent` HTML snippet döner
3. Frontend snippet'i `/payment/` sayfasında embed eder; kullanıcı kart bilgilerini iyzico formuna girer
4. iyzico ödemeyi işler → `POST /api/payment-callback`
5. Backend sonucu doğrular → Payments + Licenses listelerine kaydeder, Customers status'ü `active` yapar, lisans anahtarını e-posta ile gönderir
6. Backend kullanıcıyı `/payment-result/?status=success&plan=…` adresine yönlendirir

### `/api/trynow` ek kontrolü
- Aynı `sccmSupportId` daha önce kayıtlıysa → 409 döner
- `windowsVersion` değerleri: `26200` (Win 11 25H2) veya `26100` (Win 11 24H2)

### SharePoint Listeleri
Tüm form/ödeme kayıtları SharePoint'e yazılır:

| Liste                    | Amaç                               | Env Değişkeni        |
|--------------------------|------------------------------------|----------------------|
| `ContactFormSubmissions` | İletişim formu gönderimleri        | `CONTACT_LIST_ID`    |
| `TrialRequests`          | Deneme talepleri                   | `TRYNOW_LIST_ID`     |
| `Customers`              | Müşteriler + sipariş bilgileri     | `CUSTOMERS_LIST_ID`  |
| `Payments`               | iyzico ödeme işlem kayıtları       | `PAYMENTS_LIST_ID`   |
| `Licenses`               | Aktif lisans anahtarları           | `LICENSES_LIST_ID`   |

Yeni listeler `upgrademate-api/_setup/create-sharepoint-lists.js` scripti ile oluşturulabilir. Şema detayları: `upgrademate-api/_docs/setup/PAYMENT-KURULUM.md` → ADIM 3.

### Ortam Değişkenleri (Azure App Service'te tanımlı)
```
# Microsoft Graph / SharePoint
TENANT_ID              – Microsoft Entra tenant ID
CLIENT_ID              – App registration client ID
CLIENT_SECRET          – App registration client secret
SHAREPOINT_SITE_ID     – SharePoint site ID
CONTACT_LIST_ID        – İletişim formu listesi
TRYNOW_LIST_ID         – Deneme talebi listesi
CUSTOMERS_LIST_ID      – Müşteri/sipariş listesi
PAYMENTS_LIST_ID       – Ödeme işlem listesi
LICENSES_LIST_ID       – Lisans listesi
SENDER_EMAIL           – Mail gönderen hesap (Microsoft 365)
NOTIFICATION_EMAIL     – Form bildirimlerinin gideceği adres

# iyzico
IYZICO_API_KEY         – iyzico API anahtarı
IYZICO_SECRET_KEY      – iyzico secret anahtar
IYZICO_API_URL         – sandbox: https://sandbox-api.iyzipay.com / prod: https://api.iyzipay.com

# URL'ler
FUNCTION_APP_URL       – Backend URL (callback için)
FRONTEND_URL           – Frontend URL (result yönlendirmesi için)
ALLOWED_ORIGIN         – CORS izni (prod: https://upgrademate.io)

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY   – CAPTCHA doğrulama
```

Yerel geliştirme için bu değişkenler `local.settings.json`'da tutulur (git'e commit edilmez).

---

## Form Güvenliği

Her form iki katmanlı bot koruması kullanır:

1. **Honeypot:** `<input name="website">` gizli alanda; botlar doldurur, backend sahte 200 döner
2. **Cloudflare Turnstile:** Site key `0x4AAAAAAC0prEEJSRvXpHZo`, tema `dark`

Doğrulama hem istemci (JS) hem sunucu (Azure Function) tarafında yapılır.

---

## iyzico Başvuru Gereksinimleri

iyzico merchant hesabı başvurusu için aşağıdakiler eklendi:
- ✅ **Hukuki sayfalar:** `/privacy/`, `/delivery-returns/`, `/terms/`
- ✅ **Footer linkler:** Üç hukuki sayfanın linkleri tüm site footer'ında
- ✅ **Ödeme logo bandı:** `/checkout/` sayfasında Order Summary kartı içinde (`Assets/Ico_PaymentBand.png`)
- ✅ **Fatura alanları:** Corporate seçeneğinde Company Title + Corporate Tax Number
- ✅ **İletişim e-postası:** `info@upgrademate.io` tüm hukuki sayfalarda ve ödeme sayfasında

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

- **Frontend:** Statik dosyalar (Azure Static Web Apps veya benzeri) — `https://upgrademate.io`
- **API:** Azure App Service — `https://api.upgrademate.io` (custom domain) / `https://upgrademate-api-eshge4a4ezapcmep.westeurope-01.azurewebsites.net`

---

## Önemli Kurallar

- CSS değişkenleri tüm sayfalarda inline `<style>` içinde tekrarlanır — bu kasıtlı bir tasarım kararıdır, ortak stylesheet'e çekme.
- Yeni bir sayfa eklerken mevcut sayfaların HTML/CSS yapısını kalıp olarak kullan.
- Yeni sayfalar için footer'ı mevcut sayfalardan kopyala (`.footer-brand` + `.footer-meta` yapısı) — legal linkleri atlama.
- Asset yolları alt sayfalarda (`contact/`, `trynow/`, `thank-you/`, `checkout/`, `payment/`, `payment-result/`, `privacy/`, `delivery-returns/`, `terms/`) `../Assets/` ile başlar.
- Fiyatlandırma bilgisi değiştiğinde hem `index.html` (pricing section), hem `checkout/index.html` (PLANS object), hem `upgrademate-api/payment-init/index.js` (PLANS object), hem de `upgrademate-api/_docs/architecture/upgrademate-landing.md` güncellenmeli.
- iyzico'nun resmi logo paketindeki asset'leri değiştirmeden kullan — iyzico Terms of Use bunu gerektirir.
- API URL'lerini kod içinde değiştirme; `ALLOWED_ORIGIN` ortam değişkeni prod/local ayrımını sağlar.
