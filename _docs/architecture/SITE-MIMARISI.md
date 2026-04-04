# UpgradeMate Site Mimarisi

> **Son güncelleme:** 2026-04-04
> **Durum:** Geliştirme aşaması — production henüz yayında değil

---

## Genel Bakış

```
upgrademate.io (production hedef)
│
├── Static Frontend    → GitHub Pages (TestWebSite repo)
├── Form Backend       → Azure Functions (upgrademate-api repo)  [⏳ kurulum aşaması]
├── Veri Katmanı       → SharePoint Lists + Exchange Online (M365 E3)
├── CDN & Güvenlik     → Cloudflare Free Plan                    [⏳ kurulum aşaması]
└── Ödeme              → iyzico Checkout Form                    [⏳ planlandı]
```

---

## Frontend (TestWebSite repo)

### Teknoloji
- Pure HTML / CSS / JavaScript — framework yok
- Harici bağımlılık: Google Fonts (Inter), Cloudflare Turnstile
- Hosting: GitHub Pages → `upgrademate.io` (özel domain)

### Sayfa Yapısı

```
TestWebSite/
│
├── index.html                  ✅ Landing page
├── contact/
│   └── index.html              ✅ İletişim formu
├── trynow/
│   └── index.html              ✅ Ücretsiz deneme formu
│
├── docs/                       ⏳ Ürün dokümantasyonu (planlandı)
│   └── index.html
├── pricing/                    ⏳ Plan & fiyatlandırma (planlandı)
│   └── index.html
├── checkout/                   ⏳ iyzico ödeme embed (planlandı)
│   └── index.html
└── payment-result/             ⏳ Ödeme sonuç sayfası (planlandı)
    └── index.html
```

### Assets Klasörü

```
Assets/
├── LogoBig_Dark.png            Logo (nav, footer)
├── Ico_Web_32.png              Favicon
├── Dashboard.jpg               Hero görseli (landing)
├── Ani_ForUser.gif             Animasyon — kullanıcı bölümü
├── Ani_ForITAdmin.gif          Animasyon — IT admin bölümü
└── Ico_*.png (12 ikon)         Feature ikonları
```

### Navigasyon

| Menü | Bağlantı | Durum |
|------|----------|-------|
| Features | `/#features` | ✅ |
| For Users | `/#for-users` | ✅ |
| For IT Admins | `/#for-admins` | ✅ |
| Pricing | `/#pricing` | ✅ |
| Documents | `/docs` | ⏳ sayfa yok |
| Contact Us | `/contact` | ✅ |
| Try Now (CTA) | `/trynow` | ✅ |

---

## Backend (upgrademate-api repo)

### Teknoloji
- Azure Functions — Node.js 20, Consumption Plan (ücretsiz tier)
- Kimlik doğrulama: Azure AD App Registration (client credentials)
- Veri erişimi: Microsoft Graph API (M365 E3 dahili)
- CAPTCHA doğrulama: Cloudflare Turnstile API

### Endpoint'ler

| Endpoint | Durum | Açıklama |
|----------|-------|----------|
| `POST /api/contact` | ⏳ kurulum aşaması | İletişim formu işleme |
| `POST /api/trynow` | ⏳ kurulum aşaması | Deneme talebi işleme |
| `POST /api/payment-init` | ⏳ planlandı | iyzico ödeme başlatma |
| `POST /api/payment-callback` | ⏳ planlandı | 3DS sonuç doğrulama |
| `POST /api/webhook` | ⏳ planlandı | iyzico event bildirimleri |

### Güvenlik Katmanları (Form Endpoint'leri)

```
Request
  │
  ▼ Cloudflare WAF
  │  — DDoS koruması
  │  — IP bazlı rate limiting (/api/contact: 5 req/dk, /api/trynow: 3 req/10dk)
  │
  ▼ Azure Functions
  │  — Honeypot kontrolü (server-side)
  │  — Cloudflare Turnstile token doğrulama
  │  — Alan doğrulama & sanitization
  │  — CORS kontrolü (sadece upgrademate.io)
  │
  ▼ Microsoft Graph API
     — SharePoint'e kayıt
     — Exchange Online ile e-posta bildirimi
```

---

## Veri Katmanı (SharePoint Lists)

| Liste | Kaynak Form | Durum |
|-------|-------------|-------|
| `ContactFormSubmissions` | /contact | ⏳ oluşturulacak |
| `TrialRequests` | /trynow | ⏳ oluşturulacak |
| `Customers` | ödeme akışı | ⏳ planlandı |
| `Payments` | ödeme akışı | ⏳ planlandı |
| `Licenses` | ödeme akışı | ⏳ planlandı |

---

## CDN & Güvenlik (Cloudflare)

| Özellik | Plan | Durum |
|---------|------|-------|
| DDoS koruması | Free | ⏳ domain bağlanacak |
| CDN / önbellekleme | Free | ⏳ |
| SSL/TLS | Free | ⏳ |
| Turnstile CAPTCHA | Free | ⏳ site key alınacak |
| WAF Rate Limiting | Free | ⏳ kurallar yazılacak |

---

## Ödeme Sistemi (iyzico)

| Bileşen | Detay | Durum |
|---------|-------|-------|
| Entegrasyon yöntemi | Checkout Form (hosted) | ⏳ merchant başvurusu |
| 3DS yönetimi | iyzico otomatik | — |
| PCI DSS sorumluluğu | iyzico üstlenir | — |
| Test ortamı | iyzico Sandbox | ⏳ |
| Canlı ortam | `api.iyzipay.com` | ⏳ |

---

## Ortam Değişkenleri (Azure Functions)

| Değişken | Açıklama |
|----------|----------|
| `TENANT_ID` | Azure AD tenant ID |
| `CLIENT_ID` | App registration client ID |
| `CLIENT_SECRET` | App registration secret |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret |
| `SHAREPOINT_SITE_ID` | SharePoint site GUID |
| `SHAREPOINT_SITE_URL` | SharePoint site tam URL |
| `CONTACT_LIST_ID` | ContactFormSubmissions liste GUID |
| `TRYNOW_LIST_ID` | TrialRequests liste GUID |
| `SENDER_EMAIL` | Exchange Online gönderici UPN |
| `NOTIFICATION_EMAIL` | Bildirim alıcı adresi |
| `ALLOWED_ORIGIN` | CORS izin verilen origin |
| `IYZICO_API_KEY` | iyzico API anahtarı *(planlandı)* |
| `IYZICO_SECRET_KEY` | iyzico secret *(planlandı)* |
| `IYZICO_API_URL` | Sandbox veya production URL *(planlandı)* |
| `FUNCTION_APP_URL` | Azure Functions public URL *(planlandı)* |

> Tüm değişkenler `local.settings.json` (local) ve Azure Portal Application Settings (production) üzerinden yönetilir. **Hiçbiri kaynak koduna girmez.**

---

## Repo Yapısı

| Repo | İçerik | Görünürlük |
|------|---------|------------|
| `TestWebSite` | Static frontend | Public (GitHub Pages) |
| `upgrademate-api` | Azure Functions backend | Private |

---

## Production'a Geçiş Kontrol Listesi

- [ ] Cloudflare'e domain bağla (`upgrademate.io`)
- [ ] SSL sertifikasını Cloudflare üzerinden aktif et
- [ ] Azure Functions deploy et (`upgrademate-api`)
- [ ] Azure AD App Registration tamamla, Graph API izinleri ver
- [ ] Cloudflare Turnstile site key al
- [ ] SharePoint listelerini oluştur
- [ ] Azure Application Settings'e ortam değişkenlerini gir
- [ ] Form HTML'lerini Azure Functions URL ile güncelle
- [ ] Turnstile widget'ını formlara ekle
- [ ] Contact formu uçtan uca test et
- [ ] TryNow formu uçtan uca test et
- [ ] `_docs/` klasörünü repodan sil: `git rm -r _docs/`
- [ ] Production commit & push
