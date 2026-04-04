# Online Ödeme Sistemi Kurulum Rehberi

> **Mimari:** Azure Functions + iyzico Checkout Form + Microsoft Graph API
> **Ön koşul:** Contact ve TryNow form kurulumu tamamlanmış olmalı
> (Azure AD App, Azure Functions App, SharePoint erişimi hazır)

---

## Genel Akış

```
Kullanıcı (pricing/index.html)
  │  "Satın Al" butonuna tıklar
  ▼
Azure Functions  POST /api/payment-init
  │  iyzico Checkout Form başlatır
  │  checkoutFormContent döner
  ▼
Frontend (checkout/index.html)
  │  iyzico form HTML'i sayfaya embed eder
  ▼
Kullanıcı kart bilgisini iyzico formuna girer
  │  (3DS iyzico tarafından otomatik yönetilir)
  ▼
iyzico  POST → Azure Functions  /api/payment-callback
  │  Sonucu doğrular
  │  SharePoint'e kaydeder (Customers, Payments, Licenses)
  │  Aktivasyon e-postası gönderir
  │  Kullanıcıyı yönlendirir
  ▼
Frontend (payment-result/index.html)
  └── Başarı veya hata mesajı
```

---

## Ön Gereksinimler

- Azure Functions App çalışıyor (`upgrademate-api`)
- Azure AD App Registration tamamlanmış, Graph API izinleri verilmiş
- SharePoint'te form listeleri mevcut
- `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET` ortam değişkenleri ayarlı
- Node.js 20 + Azure Functions Core Tools v4

---

## ADIM 1: iyzico Merchant Hesabı

### Sandbox (Test) Hesabı
1. **sandbox-merchant.iyzipay.com** adresine gidin
2. **Üye İşyeri Başvurusu** → formu doldurun
3. Onay sonrası **Ayarlar → API Bilgileri** bölümünden alın:
   - **API Key** → `IYZICO_API_KEY`
   - **Secret Key** → `IYZICO_SECRET_KEY`
4. Sandbox API URL: `https://sandbox-api.iyzipay.com`

### Production Hesabı
1. **merchant.iyzipay.com** → başvuru + belge yükleme
2. iyzico onayı sonrası gerçek API anahtarlarını alın
3. Production API URL: `https://api.iyzipay.com`

> ⚠️ Sandbox ve production anahtarları birbirinden farklıdır. Geçiş sırasında her ikisini de değiştirin.

---

## ADIM 2: iyzipay Paketi Kurulumu

`upgrademate-api` proje dizininde:

```bash
npm install iyzipay
```

**`package.json`** (güncellenen bağımlılıklar):
```json
{
  "dependencies": {
    "iyzipay": "^2.0.48"
  }
}
```

---

## ADIM 3: SharePoint Listeleri

### 3a: Customers Listesi

1. SharePoint sitenize gidin → **Site contents** → **+ New** → **List**
2. Liste adı: `Customers`
3. Sütunlar:

| Sütun Adı   | Tür                 | Açıklama              |
|-------------|---------------------|-----------------------|
| Email       | Single line of text | Benzersiz müşteri ID  |
| FirstName   | Single line of text |                       |
| LastName    | Single line of text |                       |
| Company     | Single line of text |                       |
| PlanId      | Single line of text | starter / business / enterprise |
| Status      | Single line of text | active / cancelled    |
| CreatedAt   | Single line of text | ISO 8601 timestamp    |

### 3b: Payments Listesi

1. **+ New** → **List** → `Payments`
2. Sütunlar:

| Sütun Adı        | Tür                 | Açıklama                    |
|------------------|---------------------|-----------------------------|
| CustomerId       | Single line of text | Customers listesindeki Email |
| IyzicoPaymentId  | Single line of text | iyzico'nun döndürdüğü ID    |
| ConversationId   | Single line of text | İşlem takip ID'si           |
| PlanId           | Single line of text |                             |
| Amount           | Single line of text | Örn: 299.00                 |
| Currency         | Single line of text | TRY                         |
| Status           | Single line of text | success / failure           |
| PaidAt           | Single line of text | ISO 8601 timestamp          |

### 3c: Licenses Listesi

1. **+ New** → **List** → `Licenses`
2. Sütunlar:

| Sütun Adı    | Tür                 | Açıklama                  |
|--------------|---------------------|---------------------------|
| CustomerId   | Single line of text | Customers listesindeki Email |
| LicenseKey   | Single line of text | UM-XXXX-XXXX formatı      |
| PlanId       | Single line of text |                           |
| IsActive     | Single line of text | true / false              |
| ActivatedAt  | Single line of text | ISO 8601 timestamp        |
| ExpiresAt    | Single line of text | Boş = süresiz             |

**Liste ID'lerini almak** (Graph Explorer — aka.ms/ge):
```
GET https://graph.microsoft.com/v1.0/sites/{siteId}/lists
```
Her listenin `id` alanı → ortam değişkenlerine ekleyin.

---

## ADIM 4: payment-init Function

**`api/payment-init/function.json`**:
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post", "options"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

**`api/payment-init/index.js`**:
```javascript
const Iyzipay = require('iyzipay');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://upgrademate.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const PLANS = {
  starter:    { price: '299.00', name: 'UpgradeMate Starter'    },
  business:   { price: '599.00', name: 'UpgradeMate Business'   },
  enterprise: { price: '999.00', name: 'UpgradeMate Enterprise' }
};

module.exports = async function (context, req) {

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: CORS_HEADERS };
    return;
  }

  const { plan, email, firstName, lastName, company, taxNumber } = req.body || {};

  // Doğrulama
  if (!plan || !PLANS[plan]) {
    context.res = { status: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid plan' }) };
    return;
  }
  if (!email || !firstName || !lastName || !company) {
    context.res = { status: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing required fields' }) };
    return;
  }

  const selectedPlan = PLANS[plan];
  const conversationId = `UM-${Date.now()}`;

  const iyzipay = new Iyzipay({
    apiKey:    process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri:       process.env.IYZICO_API_URL
  });

  const request = {
    locale:          'tr',
    conversationId:  conversationId,
    price:           selectedPlan.price,
    paidPrice:       selectedPlan.price,
    currency:        'TRY',
    basketId:        conversationId,
    paymentGroup:    'PRODUCT',
    callbackUrl:     `${process.env.FUNCTION_APP_URL}/api/payment-callback`,
    buyer: {
      id:             email,
      name:           firstName,
      surname:        lastName,
      email:          email,
      identityNumber: taxNumber || '11111111111',
      city:           'Istanbul',
      country:        'Turkey',
      ip:             req.headers['x-forwarded-for'] || '85.34.78.112'
    },
    shippingAddress: {
      contactName: `${firstName} ${lastName}`,
      city:        'Istanbul',
      country:     'Turkey',
      address:     company
    },
    billingAddress: {
      contactName: `${firstName} ${lastName}`,
      city:        'Istanbul',
      country:     'Turkey',
      address:     company
    },
    basketItems: [{
      id:       plan,
      name:     selectedPlan.name,
      category1: 'Software',
      itemType: 'VIRTUAL',
      price:    selectedPlan.price
    }]
  };

  return new Promise((resolve) => {
    iyzipay.checkoutFormInitialize.create(request, function (err, result) {
      if (err || result.status !== 'success') {
        context.log.error('iyzico init error:', err || result);
        context.res = {
          status: 500,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Payment initialization failed' })
        };
      } else {
        context.res = {
          status: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            checkoutFormContent: result.checkoutFormContent,
            token: result.token,
            conversationId: conversationId
          })
        };
      }
      resolve();
    });
  });
};
```

---

## ADIM 5: payment-callback Function

> iyzico bu endpoint'e POST atar — frontend değil iyzico çağırır.
> Kullanıcı tarayıcısı burada değil, bu fonksiyon yönlendirme yapar.

**`api/payment-callback/function.json`**:
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

**`api/payment-callback/index.js`**:
```javascript
const Iyzipay = require('iyzipay');
const { getGraphToken } = require('../_shared/graphAuth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://upgrademate.io';

module.exports = async function (context, req) {

  const token = req.body?.token;
  if (!token) {
    context.res = { status: 302, headers: { Location: `${FRONTEND_URL}/payment-result?status=error` } };
    return;
  }

  const iyzipay = new Iyzipay({
    apiKey:    process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri:       process.env.IYZICO_API_URL
  });

  return new Promise((resolve) => {
    iyzipay.checkoutForm.retrieve({ locale: 'tr', token }, async function (err, result) {

      if (err || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
        context.log.warn('Payment failed:', result?.errorMessage || err);
        context.res = {
          status: 302,
          headers: { Location: `${FRONTEND_URL}/payment-result?status=error&msg=${encodeURIComponent(result?.errorMessage || 'Payment failed')}` }
        };
        resolve();
        return;
      }

      try {
        const graphToken = await getGraphToken();

        // Basket item'dan plan ID'yi al
        const planId = result.basketId?.replace(/^UM-\d+-/, '') || result.basketItems?.[0]?.id || 'unknown';
        const email    = result.buyer?.email;
        const firstName = result.buyer?.name;
        const lastName  = result.buyer?.surname;
        const company   = result.billingAddress?.address;

        // Paralel kayıt: Customer + Payment
        await Promise.all([
          upsertCustomer(graphToken, { email, firstName, lastName, company, planId }),
          savePayment(graphToken, {
            customerId:      email,
            iyzicoPaymentId: result.paymentId,
            conversationId:  result.conversationId,
            planId,
            amount:          result.paidPrice,
            currency:        result.currency
          })
        ]);

        // Lisans oluştur ve e-posta gönder
        const licenseKey = generateLicenseKey(planId);
        await Promise.all([
          saveLicense(graphToken, { customerId: email, licenseKey, planId }),
          sendActivationEmail(graphToken, { email, firstName, lastName, planId, licenseKey })
        ]);

        context.res = {
          status: 302,
          headers: { Location: `${FRONTEND_URL}/payment-result?status=success&plan=${planId}` }
        };

      } catch (saveErr) {
        context.log.error('Post-payment save error:', saveErr);
        // Ödeme başarılı oldu, kayıt hatası olsa bile kullanıcıyı başarı sayfasına gönder
        // Manuel müdahale gerekebilir — log'ları kontrol edin
        context.res = {
          status: 302,
          headers: { Location: `${FRONTEND_URL}/payment-result?status=success&plan=unknown` }
        };
      }

      resolve();
    });
  });
};

function generateLicenseKey(planId) {
  const prefix = planId.substring(0, 3).toUpperCase();
  const part1  = Math.random().toString(36).substring(2, 7).toUpperCase();
  const part2  = Math.random().toString(36).substring(2, 7).toUpperCase();
  const part3  = Date.now().toString(36).toUpperCase().slice(-4);
  return `UM-${prefix}-${part1}-${part2}-${part3}`;
}

async function upsertCustomer(token, data) {
  const url = `https://graph.microsoft.com/v1.0/sites/${process.env.SHAREPOINT_SITE_ID}/lists/${process.env.CUSTOMERS_LIST_ID}/items`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        Email:     data.email,
        FirstName: data.firstName,
        LastName:  data.lastName,
        Company:   data.company,
        PlanId:    data.planId,
        Status:    'active',
        CreatedAt: new Date().toISOString()
      }
    })
  });
}

async function savePayment(token, data) {
  const url = `https://graph.microsoft.com/v1.0/sites/${process.env.SHAREPOINT_SITE_ID}/lists/${process.env.PAYMENTS_LIST_ID}/items`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        CustomerId:       data.customerId,
        IyzicoPaymentId:  data.iyzicoPaymentId,
        ConversationId:   data.conversationId,
        PlanId:           data.planId,
        Amount:           String(data.amount),
        Currency:         data.currency,
        Status:           'success',
        PaidAt:           new Date().toISOString()
      }
    })
  });
}

async function saveLicense(token, data) {
  const url = `https://graph.microsoft.com/v1.0/sites/${process.env.SHAREPOINT_SITE_ID}/lists/${process.env.LICENSES_LIST_ID}/items`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        CustomerId:   data.customerId,
        LicenseKey:   data.licenseKey,
        PlanId:       data.planId,
        IsActive:     'true',
        ActivatedAt:  new Date().toISOString(),
        ExpiresAt:    ''
      }
    })
  });
}

async function sendActivationEmail(token, data) {
  const planNames = {
    starter: 'Starter', business: 'Business', enterprise: 'Enterprise'
  };
  const url = `https://graph.microsoft.com/v1.0/users/${process.env.SENDER_EMAIL}/sendMail`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: `UpgradeMate ${planNames[data.planId] || data.planId} — License Activated`,
        body: {
          contentType: 'HTML',
          content: `
            <h2>Welcome to UpgradeMate!</h2>
            <p>Hi ${data.firstName},</p>
            <p>Your <strong>UpgradeMate ${planNames[data.planId] || data.planId}</strong> license is now active.</p>
            <table cellpadding="12" cellspacing="0" border="1" style="border-collapse:collapse;margin:20px 0">
              <tr>
                <td><strong>License Key</strong></td>
                <td style="font-family:monospace;font-size:16px;letter-spacing:2px">
                  <strong>${data.licenseKey}</strong>
                </td>
              </tr>
              <tr><td><strong>Plan</strong></td><td>${planNames[data.planId] || data.planId}</td></tr>
              <tr><td><strong>Activated</strong></td><td>${new Date().toLocaleDateString('tr-TR')}</td></tr>
            </table>
            <p>Please keep your license key safe. You'll need it during UpgradeMate setup.</p>
            <p>Questions? Reply to this email or visit our documentation.</p>
            <p>— UpgradeMate Team</p>
          `
        },
        toRecipients: [{ emailAddress: { address: data.email } }],
        from:         { emailAddress: { address: process.env.SENDER_EMAIL } }
      }
    })
  });
}
```

---

## ADIM 6: webhook Function

> iyzico, ödeme durumu değişikliklerinde (iptal, iade vb.) bu endpoint'i çağırır.

**`api/webhook/function.json`**:
```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

**`api/webhook/index.js`**:
```javascript
const crypto = require('crypto');

module.exports = async function (context, req) {

  // iyzico webhook imza doğrulaması
  const signature = req.headers['x-iyz-signature'];
  if (!verifyWebhookSignature(req.rawBody, signature)) {
    context.log.warn('Webhook signature mismatch');
    context.res = { status: 401 };
    return;
  }

  const event = req.body;
  context.log.info('Webhook event:', event.eventType, event.paymentConversationId);

  switch (event.eventType) {
    case 'PAYMENT_COMPLETED':
      // Zaten payment-callback'te işlendi, loglama yeterli
      break;

    case 'REFUND_REQUESTED':
    case 'REFUND_COMPLETED':
      // TODO: SharePoint'te ilgili ödeme kaydını güncelle, lisansı deaktive et
      context.log.warn('Refund event — manual review needed:', event);
      break;

    default:
      context.log.info('Unhandled webhook event:', event.eventType);
  }

  context.res = { status: 200, body: 'OK' };
};

function verifyWebhookSignature(rawBody, signature) {
  if (!signature || !process.env.IYZICO_SECRET_KEY) return false;
  const expected = crypto
    .createHmac('sha256', process.env.IYZICO_SECRET_KEY)
    .update(rawBody || '')
    .digest('hex');
  return expected === signature;
}
```

---

## ADIM 7: Frontend Sayfaları

### 7a: pricing/index.html (Plan Seçim)

Pricing sayfasındaki her plan kartının "Buy" butonuna bu fetch çağrısı eklenir:

```javascript
const API_URL = 'https://upgrademate-api.azurewebsites.net/api/payment-init';

async function startCheckout(plan) {
  // Kullanıcı bilgilerini formdan al (pricing sayfasında kısa form olabilir)
  const payload = {
    plan,
    email:     document.getElementById('email').value,
    firstName: document.getElementById('firstName').value,
    lastName:  document.getElementById('lastName').value,
    company:   document.getElementById('company').value
  };

  const res  = await fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  });
  const data = await res.json();

  // iyzico form HTML'ini checkout sayfasına taşı
  sessionStorage.setItem('checkoutForm', data.checkoutFormContent);
  window.location.href = '/checkout/';
}
```

### 7b: checkout/index.html (iyzico Form Embed)

```html
<div id="iyzipay-checkout-form" class="responsive"></div>

<script>
  // pricing'den gelen form HTML'ini embed et
  const formContent = sessionStorage.getItem('checkoutForm');
  if (!formContent) {
    window.location.href = '/pricing/';
  } else {
    document.getElementById('iyzipay-checkout-form').innerHTML = formContent;
    // iyzico kendi script'ini form içinde getiriyor, DOM'a eklenince çalışır
    const scripts = document.getElementById('iyzipay-checkout-form').querySelectorAll('script');
    scripts.forEach(s => {
      const newScript = document.createElement('script');
      newScript.textContent = s.textContent;
      document.body.appendChild(newScript);
    });
    sessionStorage.removeItem('checkoutForm');
  }
</script>
```

### 7c: payment-result/index.html (Sonuç Sayfası)

```javascript
const params  = new URLSearchParams(window.location.search);
const status  = params.get('status');   // 'success' | 'error'
const plan    = params.get('plan');
const message = params.get('msg');

if (status === 'success') {
  // Başarı mesajı göster: "Lisansınız e-posta adresinize gönderildi"
} else {
  // Hata mesajı göster: message || 'Ödeme işlemi tamamlanamadı'
}
```

---

## ADIM 8: Ortam Değişkenleri

**`local.settings.json`'a eklenecekler** (mevcut form değişkenlerine ek):
```json
{
  "Values": {
    "IYZICO_API_KEY":      "sandbox_xxxxxxxxxxxxxxxx",
    "IYZICO_SECRET_KEY":   "sandbox_xxxxxxxxxxxxxxxx",
    "IYZICO_API_URL":      "https://sandbox-api.iyzipay.com",
    "FUNCTION_APP_URL":    "http://localhost:7071",
    "FRONTEND_URL":        "http://localhost:3000",
    "CUSTOMERS_LIST_ID":   "xxxx-xxxx-xxxx-xxxx",
    "PAYMENTS_LIST_ID":    "xxxx-xxxx-xxxx-xxxx",
    "LICENSES_LIST_ID":    "xxxx-xxxx-xxxx-xxxx"
  }
}
```

**Azure Portal — Application Settings** (production):
```
IYZICO_API_KEY      = [production key]
IYZICO_SECRET_KEY   = [production key]
IYZICO_API_URL      = https://api.iyzipay.com
FUNCTION_APP_URL    = https://upgrademate-api.azurewebsites.net
FRONTEND_URL        = https://upgrademate.io
CUSTOMERS_LIST_ID   = [GUID]
PAYMENTS_LIST_ID    = [GUID]
LICENSES_LIST_ID    = [GUID]
```

**iyzico Webhook URL'yi kaydedin** (iyzico merchant paneli → Ayarlar → Webhook):
```
https://upgrademate-api.azurewebsites.net/api/webhook
```

---

## ADIM 9: Deploy

```bash
# Bağımlılıkları yükle (iyzipay yeni eklendi)
npm install

# Azure'a deploy
func azure functionapp publish upgrademate-api
```

---

## ADIM 10: Test (Sandbox)

### iyzico Test Kartları

| Senaryo | Kart No | SKT | CVC |
|---------|---------|-----|-----|
| Başarılı ödeme | 5528790000000008 | 12/30 | 123 |
| Başarısız ödeme | 5506751106510157 | 12/30 | 123 |
| 3DS başarılı | 4603450000000000 | 12/30 | 000 |

> Tam test kart listesi: https://dev.iyzipay.com/tr/test-kartlari

### Test Akışı

```bash
# 1. Local Functions başlat
func start

# 2. payment-init test
curl -X POST http://localhost:7071/api/payment-init \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "starter",
    "email": "test@company.com",
    "firstName": "Test",
    "lastName": "User",
    "company": "Test Corp"
  }'
# → checkoutFormContent döner (HTML snippet)

# 3. Dönen token ile callback simülasyonu (iyzico sandbox'ta test edin)
```

### Kontrol Listesi

- ✅ payment-init başarılı `checkoutFormContent` döndürüyor mu?
- ✅ iyzico sandbox formunda test kartıyla ödeme tamamlanıyor mu?
- ✅ payment-callback tetikleniyor mu? (Azure Function Monitor log)
- ✅ SharePoint `Customers` listesinde yeni kayıt var mı?
- ✅ SharePoint `Payments` listesinde kayıt var mı, Status = "success"?
- ✅ SharePoint `Licenses` listesinde `UM-XXX-...` formatlı lisans var mı?
- ✅ Müşteri e-posta adresine aktivasyon maili geldi mi?
- ✅ `payment-result?status=success` sayfası doğru görünüyor mu?
- ✅ Başarısız kart ile `payment-result?status=error` sayfası gösteriliyor mu?

---

## ADIM 11: Production Geçişi

1. iyzico merchant panelinde production API anahtarlarını alın
2. Azure Portal → Function App → **Configuration**'da şunları güncelleyin:
   ```
   IYZICO_API_KEY    = [production key]
   IYZICO_SECRET_KEY = [production key]
   IYZICO_API_URL    = https://api.iyzipay.com
   FUNCTION_APP_URL  = https://upgrademate-api.azurewebsites.net
   FRONTEND_URL      = https://upgrademate.io
   ```
3. iyzico merchant paneli → **Webhook URL** production adresine güncelleyin
4. Production'da gerçek kartla küçük miktarda test ödemesi yapın
5. Test ödemesini merchant panelinden iade edin

---

## Sorun Giderme

| Hata | Neden | Çözüm |
|------|-------|-------|
| `Payment initialization failed` | iyzico API key yanlış veya sandbox/prod karışıklığı | `IYZICO_API_URL` ve key'lerin uyumunu kontrol edin |
| Callback tetiklenmiyor | iyzico `callbackUrl` ulaşamıyor | `FUNCTION_APP_URL` doğru mu? Local'de ngrok kullanın |
| SharePoint kayıt hatası | List ID yanlış veya izin eksik | `CUSTOMERS/PAYMENTS/LICENSES_LIST_ID` GUID'lerini kontrol edin |
| Lisans maili gitmiyor | `SENDER_EMAIL` Exchange'de aktif değil | Graph API `Mail.Send` izni ve UPN doğru mu? |
| Webhook 401 | İmza uyuşmuyor | `IYZICO_SECRET_KEY` production key ile güncellendi mi? |
| `checkoutFormContent` boş | iyzico price/buyer alanı eksik | `req.body` logları inceleyin |

### Local Test için ngrok (payment-callback için)

iyzico, callback URL'ye POST atmak için dışarıdan erişilebilir bir adres ister. Local test sırasında:

```bash
# ngrok kurulumu: ngrok.com
ngrok http 7071

# Dönen URL'yi kullanın:
# FUNCTION_APP_URL = https://xxxx.ngrok.io
# iyzico callbackUrl = https://xxxx.ngrok.io/api/payment-callback
```
