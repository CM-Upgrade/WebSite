# UpgradeMate × iyzico Ödeme Sistemi Mimarisi

> Bu belge, online payment entegrasyonuna başlamadan önce tasarlanan mimariyi belgeler.
> Geliştirmeye hazır olunduğunda buradan devam edilecek.

---

## Mevcut Durum (Başlangıç Noktası)

- Frontend: Static HTML/CSS/JS — GitHub Pages (`cm-upgrade.github.io/TestWebSite`)
- Production: `www.upgrademate.io` (planlanan)
- Form backend: Power Automate + SharePoint (contact ve trynow formları aktif)
- Payment: Henüz başlanmadı

---

## Genel Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Static)                     │
│         GitHub Pages → upgrademate.io                   │
│   HTML/CSS/JS  ·  Pricing  ·  Checkout  ·  Success      │
└──────────────────────┬──────────────────────────────────┘
                       │ fetch() / HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                 BACKEND (Azure Functions)                │
│                                                          │
│  /api/payment-init      → iyzico'ya ödeme başlat        │
│  /api/payment-callback  → 3DS sonucu al & doğrula       │
│  /api/webhook           → iyzico bildirimlerini işle    │
└──────┬────────────────────┬───────────────────┬─────────┘
       │                    │                   │
┌──────▼──────┐   ┌─────────▼──────┐  ┌────────▼────────┐
│   iyzico    │   │   SharePoint   │  │ Outlook / Teams │
│   API       │   │  (Müşteri DB)  │  │ (Bildirimler)   │
└─────────────┘   └────────────────┘  └─────────────────┘
```

---

## iyzico Ödeme Akışı (Checkout Form — 3DS dahil)

```
Kullanıcı          Frontend             Azure Fn          iyzico
    │                  │                    │                │
    │── "Satın Al" ───►│                    │                │
    │                  │── POST /payment ──►│                │
    │                  │   { plan, email }  │── initialize ─►│
    │                  │                   │◄── token + form─│
    │                  │◄── checkoutForm ───│                │
    │◄── iyzico form ──│                    │                │
    │── kart bilgisi ──────────────────────────────────────►│
    │                  │                    │◄── 3DS callback─│
    │                  │                   │── doğrula ─────►│
    │                  │                   │◄── sonuç ───────│
    │                  │◄── redirect ───────│                │
    │◄── success.html ─│                    │                │
```

---

## Klasör Yapısı

### Frontend (mevcut repo — TestWebSite)
```
TestWebSite/
├── index.html                ✅ mevcut
├── contact/index.html        ✅ mevcut (Power Automate entegreli)
├── trynow/index.html         ✅ mevcut (Power Automate entegreli)
├── pricing/                  ⏳ YENİ: plan seçim sayfası
│   └── index.html
├── checkout/                 ⏳ YENİ: iyzico form embed sayfası
│   └── index.html
└── payment-result/           ⏳ YENİ: başarı/hata yönlendirme sayfası
    └── index.html
```

### Backend (ayrı repo — upgrademate-api)
```
upgrademate-api/              ⏳ YENİ repo (Azure Functions, Node.js)
├── payment-init/
│   └── index.js              → iyzico Checkout Form başlatır
├── payment-callback/
│   └── index.js              → 3DS sonucunu doğrular
├── webhook/
│   └── index.js              → iyzico event'lerini işler
└── local.settings.json       → API anahtarları (git'e GİRMEZ)
```

---

## Azure Function — payment-init Mantığı

```javascript
const iyzipay = new Iyzipay({
  apiKey:    process.env.IYZICO_API_KEY,       // Azure Key Vault'tan gelir
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri:       'https://sandbox-api.iyzipay.com' // prod: api.iyzipay.com
});

// Frontend'den gelen : { plan, email, name, company, ... }
// iyzico'ya gönderilen: fiyat, müşteri bilgisi, callbackUrl
// Frontend'e dönen   : checkoutFormContent (HTML snippet → sayfaya embed edilir)
```

---

## SharePoint Veri Modeli

| Liste | Sütunlar |
|---|---|
| **Customers** | Email, Name, Company, PlanId, Status, CreatedAt |
| **Payments** | CustomerId, iyzico_PaymentId, Amount, Status, PaidAt |
| **Licenses** | CustomerId, LicenseKey, ExpiresAt, SccmSiteCode |

---

## Teknoloji Kararları

| Karar | Seçim | Neden |
|---|---|---|
| Backend runtime | Azure Functions (Node.js) | M365 ekosistemine uygun, serverless |
| iyzico entegrasyon yöntemi | Checkout Form | 3DS otomatik, PCI DSS sorumluluğu iyzico'da |
| Frontend host | GitHub Pages → upgrademate.io | Değişmez, static kalır |
| Veritabanı | SharePoint Lists | Zaten var, Power Automate ile entegre |
| Gizli anahtarlar | Azure Key Vault | Production için zorunlu |
| Test ortamı | iyzico Sandbox | Gerçek kart gerekmez |

---

## Uygulama Adımları (Sırayla)

- [ ] 1. iyzico Merchant başvurusu → sandbox API anahtarlarını al
- [ ] 2. `upgrademate-api` Azure Functions reposunu kur (Node.js)
- [ ] 3. `pricing/index.html` → plan seçim sayfası
- [ ] 4. `checkout/index.html` → iyzico Checkout Form embed
- [ ] 5. `payment-result/index.html` → başarı/hata yönlendirme
- [ ] 6. SharePoint lisanslama akışı (Power Automate)
- [ ] 7. Sandbox testleri (iyzico test kartları ile)
- [ ] 8. Production geçişi (`api.iyzipay.com`)

---

## Önemli Notlar

- Frontend **tek satır değişmez** — sadece `fetch('/api/payment-init', {...})` çağrısı eklenir
- iyzico API anahtarları (`apiKey`, `secretKey`) **asla frontend koduna girmez**
- 3DS akışı iyzico Checkout Form kullanıldığında otomatik olarak yönetilir
- iyzico Sandbox test kartları: https://dev.iyzipay.com/tr/test-kartlari
