# UpgradeMate Ödeme Sistemi Mimarisi

> **Backend:** Azure Functions (Node.js) — form backend ile aynı uygulama
> **Ödeme:** iyzico Checkout Form (3DS dahil, PCI DSS iyzico'da)
> **Veritabanı:** SharePoint Lists (M365 E3 dahili)
> **Geliştirme durumu:** Planlama aşaması — iyzico merchant başvurusu bekleniyor

---

## Mevcut Durum

```
Frontend:    GitHub Pages → upgrademate.io (static HTML/CSS/JS)
Form backend: Azure Functions (upgrademate-api) — contact + trynow aktif
Payment:     Henüz başlanmadı
```

---

## Genel Mimari

```
┌─────────────────────────────────────────────────────────┐
│                 FRONTEND (Static)                        │
│         GitHub Pages → upgrademate.io                   │
│   pricing/  ·  checkout/  ·  payment-result/            │
└──────────────────────┬──────────────────────────────────┘
                       │ fetch() HTTPS
┌──────────────────────▼──────────────────────────────────┐
│          AZURE FUNCTIONS  (upgrademate-api)              │
│                                                          │
│  /api/contact          ✅ aktif                          │
│  /api/trynow           ✅ aktif                          │
│  /api/payment-init     ⏳ iyzico ödeme başlat            │
│  /api/payment-callback ⏳ 3DS sonucu doğrula             │
│  /api/webhook          ⏳ iyzico event bildirimleri      │
└──────┬────────────────────┬───────────────────┬─────────┘
       │ iyzico SDK         │ Graph API          │ Graph API
┌──────▼──────┐   ┌─────────▼──────┐  ┌─────────▼───────┐
│   iyzico    │   │   SharePoint   │  │ Exchange Online  │
│   API       │   │  Lists         │  │ (Bildirimler)   │
└─────────────┘   └────────────────┘  └─────────────────┘
        ↑
Cloudflare (upgrademate.io)
  DDoS koruma · CDN · Turnstile CAPTCHA · Rate Limiting
```

---

## iyzico Ödeme Akışı (Checkout Form — 3DS dahil)

```
Kullanıcı          Frontend             Azure Fn          iyzico
    │                  │                    │                │
    │── Plan seç ─────►│                    │                │
    │                  │── POST /payment ──►│                │
    │                  │   { plan, email }  │── initialize ─►│
    │                  │                   │◄── token+form ──│
    │                  │◄── checkoutForm ───│                │
    │◄── iyzico form ──│                    │                │
    │── kart bilgisi ──────────────────────────────────────►│
    │                  │                    │◄── 3DS CB ──── │
    │                  │                   │── doğrula ─────►│
    │                  │                   │◄── sonuç ───────│
    │                  │◄── redirect ───────│                │
    │◄── result.html ──│                    │                │
```

---

## Klasör Yapısı

### Frontend (TestWebSite repo — mevcut)
```
TestWebSite/
├── index.html                ✅ mevcut
├── contact/index.html        ✅ mevcut (Azure Functions entegreli)
├── trynow/index.html         ✅ mevcut (Azure Functions entegreli)
├── pricing/                  ⏳ YENİ: plan seçim sayfası
│   └── index.html
├── checkout/                 ⏳ YENİ: iyzico form embed sayfası
│   └── index.html
└── payment-result/           ⏳ YENİ: başarı/hata yönlendirme
    └── index.html
```

### Backend (upgrademate-api repo — kısmen aktif)
```
upgrademate-api/
├── api/
│   ├── contact/              ✅ aktif
│   │   └── index.js
│   ├── trynow/               ✅ aktif
│   │   └── index.js
│   ├── payment-init/         ⏳ YENİ
│   │   └── index.js
│   ├── payment-callback/     ⏳ YENİ
│   │   └── index.js
│   ├── webhook/              ⏳ YENİ
│   │   └── index.js
│   └── _shared/
│       ├── graphAuth.js      ✅ mevcut (ortak)
│       └── turnstile.js      ✅ mevcut (ortak)
├── local.settings.json       ← git'e GİRMEZ
└── package.json
```

---

## SharePoint Veri Modeli

### Mevcut Listeler
| Liste                   | Sütunlar                                                                   |
|-------------------------|----------------------------------------------------------------------------|
| **ContactFormSubmissions** | FirstName, LastName, Email, CompanyName, Message, SubmittedAt           |
| **TrialRequests**          | FirstName, LastName, Email, CompanyName, SccmSiteCode, SccmSupportId, ComputerCount, WindowsVersion, SubmittedAt, Status |

### Ödeme için Eklenecek Listeler
| Liste        | Sütunlar                                                              |
|--------------|-----------------------------------------------------------------------|
| **Customers**  | Email, FirstName, LastName, Company, PlanId, Status, CreatedAt      |
| **Payments**   | CustomerId, IyzicoPaymentId, Amount, Currency, Status, PaidAt       |
| **Licenses**   | CustomerId, LicenseKey, ExpiresAt, SccmSiteCode, IsActive           |

---

## Azure Function — payment-init Mantığı

```javascript
// api/payment-init/index.js
const Iyzipay = require('iyzipay');

const iyzipay = new Iyzipay({
  apiKey:    process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri:       process.env.IYZICO_API_URL   // sandbox veya prod
});

module.exports = async function(context, req) {
  // Frontend'den gelir: { plan, email, firstName, lastName, company }
  // iyzico'ya gönderilir: fiyat, müşteri bilgisi, callbackUrl
  // Frontend'e döner: checkoutFormContent (HTML snippet → sayfaya embed)

  const { plan, email, firstName, lastName, company } = req.body;

  // Plan fiyatlarını ortam değişkeninden veya sabit obje'den al
  const PLANS = {
    'starter':    { price: '299.00', name: 'Starter Plan'    },
    'business':   { price: '599.00', name: 'Business Plan'   },
    'enterprise': { price: '999.00', name: 'Enterprise Plan' }
  };
  const selectedPlan = PLANS[plan];
  if (!selectedPlan) { context.res = { status: 400 }; return; }

  const request = {
    locale: 'tr',
    conversationId: Date.now().toString(),
    price: selectedPlan.price,
    paidPrice: selectedPlan.price,
    currency: 'TRY',
    basketId: `basket_${Date.now()}`,
    paymentGroup: 'PRODUCT',
    callbackUrl: `${process.env.FUNCTION_APP_URL}/api/payment-callback`,
    buyer: {
      id: email,
      name: firstName,
      surname: lastName,
      email: email,
      identityNumber: '11111111111',   // B2B için şirket vergi no daha uygun
      city: 'Istanbul',
      country: 'Turkey',
      ip: req.headers['x-forwarded-for']
    },
    shippingAddress: { contactName: `${firstName} ${lastName}`, city: 'Istanbul', country: 'Turkey', address: company },
    billingAddress:  { contactName: `${firstName} ${lastName}`, city: 'Istanbul', country: 'Turkey', address: company },
    basketItems: [{
      id: plan,
      name: selectedPlan.name,
      category1: 'Software',
      itemType: 'VIRTUAL',
      price: selectedPlan.price
    }]
  };

  iyzipay.checkoutFormInitialize.create(request, function(err, result) {
    if (err || result.status !== 'success') {
      context.res = { status: 500, body: JSON.stringify({ error: 'Payment init failed' }) };
      return;
    }
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutFormContent: result.checkoutFormContent })
    };
  });
};
```

---

## Ortam Değişkenleri (Ödeme için Eklenecekler)

`local.settings.json` ve Azure Portal Application settings'e eklenecekler:

| Değişken            | Açıklama                                         |
|---------------------|--------------------------------------------------|
| `IYZICO_API_KEY`    | iyzico merchant API key                          |
| `IYZICO_SECRET_KEY` | iyzico merchant secret key                       |
| `IYZICO_API_URL`    | Sandbox: `https://sandbox-api.iyzipay.com`       |
| `FUNCTION_APP_URL`  | `https://upgrademate-api.azurewebsites.net`      |

> **Güvenlik:** iyzico anahtarları asla frontend koduna girmez.
> Production'da Azure Key Vault ile yönetilmesi önerilir.

---

## Teknoloji Kararları

| Karar | Seçim | Neden |
|-------|-------|-------|
| Backend runtime | Azure Functions Node.js 20 (Consumption) | Ücretsiz tier, M365 ekosistemine uygun |
| Form backend | Microsoft Graph API | M365 E3'e dahil, PA Premium gerektirmez |
| iyzico entegrasyon | Checkout Form | 3DS otomatik, PCI DSS iyzico'da kalır |
| CAPTCHA | Cloudflare Turnstile | Ücretsiz, server-side doğrulanabilir |
| DDoS koruması | Cloudflare Free Plan | Otomatik, ücretsiz |
| Veritabanı | SharePoint Lists + Graph API | Mevcut altyapı, ek maliyet yok |
| Gizli anahtarlar | Azure App Settings → Key Vault (prod) | Frontend'den izole |
| Test ortamı | iyzico Sandbox | Gerçek kart gerekmez |

---

## Uygulama Adımları (Sırayla)

### Tamamlanan
- [x] Contact form — Azure Functions + Graph API
- [x] TryNow form — Azure Functions + Graph API
- [x] Cloudflare Turnstile güvenlik katmanı

### Ödeme için Yapılacaklar
- [ ] iyzico Merchant başvurusu → sandbox API anahtarlarını al
- [ ] `iyzipay` npm paketi → `upgrademate-api` projesine ekle
- [ ] `pricing/index.html` → plan seçim sayfası
- [ ] `checkout/index.html` → iyzico Checkout Form embed
- [ ] `payment-result/index.html` → başarı/hata yönlendirme
- [ ] `api/payment-init/index.js` → ödeme başlatma function
- [ ] `api/payment-callback/index.js` → 3DS sonucu doğrulama
- [ ] SharePoint: Customers, Payments, Licenses listelerini oluştur
- [ ] Power Automate (free tier): Ödeme sonrası lisans aktivasyon akışı
- [ ] Sandbox testleri (iyzico test kartları)
- [ ] Production geçişi: `api.iyzipay.com` + Azure Key Vault

---

## Önemli Notlar

- Frontend **tek satır değişmez** — sadece `fetch('/api/payment-init', {...})` çağrısı eklenir
- iyzico API anahtarları (`apiKey`, `secretKey`) **asla frontend koduna girmez**
- 3DS akışı iyzico Checkout Form kullanıldığında otomatik yönetilir
- iyzico Sandbox test kartları: https://dev.iyzipay.com/tr/test-kartlari
- Power Automate free tier (lisans akışı için): Zamanlanmış tetikleyici veya SharePoint tetikleyicisi Premium gerektirmez
