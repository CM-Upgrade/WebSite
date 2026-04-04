# Contact Formu Kurulum Rehberi

> **Mimari:** Azure Functions (Node.js) + Microsoft Graph API + Cloudflare Turnstile
> **Maliyet:** Ücretsiz (M365 E3 dahili + Azure free tier + Cloudflare free)
> **Power Automate Premium gerektirmez.**

---

## Genel Akış

```
Kullanıcı (contact/index.html)
  │  form gönder + Turnstile token
  ▼
Cloudflare (upgrademate.io)
  │  DDoS filtre, Rate Limit, bot engel
  ▼
Azure Functions  /api/contact
  │  ① Turnstile token doğrula (Cloudflare API)
  │  ② Honeypot kontrolü
  │  ③ Alan doğrulama
  │  ④ Graph API token al
  │  ⑤ SharePoint'e kaydet
  │  ⑥ E-posta bildir (Exchange Online)
  ▼
Exchange Online → info@upgrademate.com
SharePoint List → ContactFormSubmissions
```

---

## Ön Gereksinimler

- Azure hesabı (portal.azure.com) — M365 E3 ile birlikte gelir
- Cloudflare hesabı — ücretsiz (dash.cloudflare.com)
- Node.js 20 LTS (local geliştirme için)
- Azure Functions Core Tools v4 (local test için)
- Git

> **Not:** Bu form ve TryNow formu aynı Azure altyapısını paylaşır.
> Azure AD App Registration ve Azure Functions App adımları **bir kez** yapılır.
> Her iki formu kuruyorsanız bu adımları atlayabilirsiniz.

---

## ADIM 1: Azure AD Uygulama Kaydı

> ⚠️ TryNow formu için zaten yaptıysanız bu adımı atlayın.

1. **portal.azure.com** → **Azure Active Directory** → **App registrations**
2. **New registration** tıklayın:
   - Name: `UpgradeMate Form Handler`
   - Supported account types: **Single tenant**
   - Redirect URI: boş bırakın
3. **Register** → oluşturulan uygulamayı açın
4. Şunları not edin:
   - **Application (client) ID** → `CLIENT_ID`
   - **Directory (tenant) ID** → `TENANT_ID`
5. **Certificates & secrets** → **New client secret**:
   - Description: `form-handler-secret`
   - Expires: 24 months
   - **Value** kısmını hemen kopyalayın → `CLIENT_SECRET`
     *(sayfayı yenileyince bir daha göremezsiniz)*
6. **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions**:
   - `Mail.Send` — e-posta gönderimi
   - `Sites.ReadWrite.All` — SharePoint liste erişimi
7. **Grant admin consent for [organizasyon]** → **Yes**

---

## ADIM 2: SharePoint Listesi

1. SharePoint sitenize gidin
2. **Site contents** → **+ New** → **List**
3. Liste adı: `ContactFormSubmissions`
4. Şu sütunları ekleyin (**+ Add column** ile):

| Sütun Adı   | Tür                 |
|-------------|---------------------|
| FirstName   | Single line of text |
| LastName    | Single line of text |
| Email       | Single line of text |
| CompanyName | Single line of text |
| Message     | Multiple lines      |
| SubmittedAt | Single line of text |

5. SharePoint site URL'nizi not edin: `https://[tenant].sharepoint.com/sites/[site]`

**SharePoint Site ID ve List ID'yi almak:**

```
https://graph.microsoft.com/v1.0/sites/[tenant].sharepoint.com:/sites/[site]
```

Bu URL'yi Graph Explorer (aka.ms/ge) üzerinden çağırın:
- Dönen JSON'dan `id` → `SHAREPOINT_SITE_ID`
- Sonra: `https://graph.microsoft.com/v1.0/sites/{siteId}/lists` → `ContactFormSubmissions`'ın `id`'si → `CONTACT_LIST_ID`

---

## ADIM 3: Cloudflare Turnstile

> ⚠️ TryNow formu için zaten yaptıysanız aynı site key'i kullanabilirsiniz.

1. **dash.cloudflare.com** → **Turnstile** → **Add site**
2. Ayarlar:
   - Site name: `UpgradeMate Forms`
   - Domain: `upgrademate.io`
   - Widget type: **Managed** (önerilen)
3. Oluşturulan değerleri not edin:
   - **Site Key** (public, HTML'e girer) → `TURNSTILE_SITE_KEY`
   - **Secret Key** (private, Functions'a girer) → `TURNSTILE_SECRET_KEY`

**Cloudflare Rate Limiting (önerilen):**
- Cloudflare Dashboard → **Security** → **WAF** → **Rate limiting rules**
- Rule: `/api/contact` → 5 istek / 1 dakika / IP başına → Block 1 dakika

---

## ADIM 4: Azure Functions Projesi

> ⚠️ TryNow formu için zaten repo oluşturduysanız aynı projeye ekleyin.

```bash
# Yeni repo oluştur
mkdir upgrademate-api && cd upgrademate-api
func init --worker-runtime node --language javascript
git init
```

**Klasör yapısı:**
```
upgrademate-api/
├── api/
│   ├── contact/
│   │   ├── index.js          ← bu formun kodu
│   │   └── function.json
│   ├── trynow/               ← TryNow formu buraya
│   │   ├── index.js
│   │   └── function.json
│   └── _shared/
│       ├── graphAuth.js      ← Graph token (ortak)
│       └── turnstile.js      ← CAPTCHA doğrulama (ortak)
├── host.json
├── local.settings.json       ← git'e GİRMEZ (.gitignore'a ekle)
└── package.json
```

**function.json** (`api/contact/function.json`):
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

---

## ADIM 5: Ortak Yardımcı Dosyalar

**`api/_shared/graphAuth.js`**
```javascript
async function getGraphToken() {
  const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope:         'https://graph.microsoft.com/.default'
    })
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Graph token alınamadı');
  return data.access_token;
}

module.exports = { getGraphToken };
```

**`api/_shared/turnstile.js`**
```javascript
async function verifyTurnstile(token, ip) {
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret:   process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip
    })
  });
  const data = await res.json();
  return data.success === true;
}

module.exports = { verifyTurnstile };
```

---

## ADIM 6: Contact Function Kodu

**`api/contact/index.js`**
```javascript
const { getGraphToken }    = require('../_shared/graphAuth');
const { verifyTurnstile }  = require('../_shared/turnstile');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://upgrademate.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

module.exports = async function (context, req) {

  // CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: CORS_HEADERS };
    return;
  }

  const body = req.body;

  // ① Honeypot — bot tuzağı (sessizce başarılı döner)
  if (body?._hp) {
    context.res = { status: 200, headers: CORS_HEADERS, body: JSON.stringify({ status: 'ok' }) };
    return;
  }

  // ② Turnstile doğrulama
  const clientIp = req.headers['x-forwarded-for'] || req.headers['client-ip'];
  const captchaOk = await verifyTurnstile(body?.['cf-turnstile-response'], clientIp);
  if (!captchaOk) {
    context.res = { status: 403, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Verification failed' }) };
    return;
  }

  // ③ Alan doğrulama
  const { firstName, lastName, email, companyName, message } = body || {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!firstName?.trim() || !email?.trim() || !companyName?.trim() || !message?.trim()) {
    context.res = { status: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing required fields' }) };
    return;
  }
  if (!emailRegex.test(email.trim())) {
    context.res = { status: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid email' }) };
    return;
  }
  if (message.trim().length < 10) {
    context.res = { status: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Message too short' }) };
    return;
  }

  try {
    const token = await getGraphToken();
    await Promise.all([
      saveToSharePoint(token, { firstName, lastName, email, companyName, message }),
      sendNotificationEmail(token, { firstName, lastName, email, companyName, message })
    ]);
    context.res = { status: 200, headers: CORS_HEADERS, body: JSON.stringify({ status: 'success' }) };
  } catch (err) {
    context.log.error('Contact form error:', err);
    context.res = { status: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Server error' }) };
  }
};

async function saveToSharePoint(token, data) {
  const url = `https://graph.microsoft.com/v1.0/sites/${process.env.SHAREPOINT_SITE_ID}/lists/${process.env.CONTACT_LIST_ID}/items`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        FirstName:   data.firstName.trim(),
        LastName:    (data.lastName || '').trim(),
        Email:       data.email.trim(),
        CompanyName: data.companyName.trim(),
        Message:     data.message.trim(),
        SubmittedAt: new Date().toISOString()
      }
    })
  });
  if (!res.ok) throw new Error(`SharePoint error: ${res.status}`);
}

async function sendNotificationEmail(token, data) {
  const url = `https://graph.microsoft.com/v1.0/users/${process.env.SENDER_EMAIL}/sendMail`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: `New Contact — ${data.firstName} ${data.lastName || ''} (${data.companyName})`,
        body: {
          contentType: 'HTML',
          content: `
            <h2>New Contact Form Submission</h2>
            <table cellpadding="8" cellspacing="0">
              <tr><td><strong>Name</strong></td><td>${data.firstName} ${data.lastName || ''}</td></tr>
              <tr><td><strong>Email</strong></td><td>${data.email}</td></tr>
              <tr><td><strong>Company</strong></td><td>${data.companyName}</td></tr>
              <tr><td><strong>Submitted</strong></td><td>${new Date().toISOString()}</td></tr>
            </table>
            <h3>Message</h3>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
          `
        },
        toRecipients: [{ emailAddress: { address: process.env.NOTIFICATION_EMAIL } }],
        from: { emailAddress: { address: process.env.SENDER_EMAIL } }
      }
    })
  });
  if (!res.ok) throw new Error(`Mail error: ${res.status}`);
}
```

---

## ADIM 7: Ortam Değişkenleri

**`local.settings.json`** (local test — git'e GİRMEZ):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "TENANT_ID":              "xxxx-xxxx-xxxx-xxxx",
    "CLIENT_ID":              "xxxx-xxxx-xxxx-xxxx",
    "CLIENT_SECRET":          "xxxxxxxxxxxxxxxxxxx",
    "TURNSTILE_SECRET_KEY":   "0x4AAAAAAA...",
    "SHAREPOINT_SITE_ID":     "tenant.sharepoint.com,xxxx,xxxx",
    "CONTACT_LIST_ID":        "xxxx-xxxx-xxxx-xxxx",
    "SENDER_EMAIL":           "info@upgrademate.com",
    "NOTIFICATION_EMAIL":     "info@upgrademate.com",
    "ALLOWED_ORIGIN":         "http://localhost:3000"
  }
}
```

**.gitignore**:
```
local.settings.json
node_modules/
.env
```

**Azure Portal'da production değişkenleri:**
1. Function App → **Configuration** → **Application settings**
2. Her değişkeni `+ New application setting` ile ekleyin
3. `ALLOWED_ORIGIN` = `https://upgrademate.io`

---

## ADIM 8: Deploy

```bash
# Azure'a login
az login

# Function App oluştur (henüz yoksa)
az functionapp create \
  --resource-group upgrademate-rg \
  --consumption-plan-location westeurope \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name upgrademate-api \
  --storage-account upgradematestg

# Deploy
func azure functionapp publish upgrademate-api
```

Function URL'si: `https://upgrademate-api.azurewebsites.net/api/contact`

---

## ADIM 9: HTML Formunu Güncelleme

`contact/index.html` içinde değiştirilecekler:

1. Cloudflare Turnstile script'i `<head>`'e ekle:
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

2. Form içine Turnstile widget ekle (submit butonunun üstüne):
```html
<div class="cf-turnstile" data-sitekey="TURNSTILE_SITE_KEY_BURAYA" data-theme="dark"></div>
```

3. Form submit JS'i güncelle — endpoint ve token:
```javascript
const API_URL = 'https://upgrademate-api.azurewebsites.net/api/contact';

// fetch çağrısında:
const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
const payload = {
  firstName, lastName, email, companyName, message,
  'cf-turnstile-response': turnstileToken,
  _hp: ''   // honeypot (boş kalırsa bot değil)
};
```

4. Tüm client-side spam kontrollerini (honeypot JS, timing, sessionStorage) kaldır.

---

## ADIM 10: Test

```bash
# Local test
func start

# cURL ile test
curl -X POST http://localhost:7071/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "companyName": "Test Corp",
    "message": "Bu bir test mesajıdır.",
    "cf-turnstile-response": "XXXXX"
  }'
```

> Local test için Turnstile'ı bypass etmek: `TURNSTILE_SECRET_KEY` değerini
> `1x0000000000000000000000000000000AA` yapın (Cloudflare test secret'ı, her token'ı geçirir).

Kontrol edin:
- ✅ SharePoint `ContactFormSubmissions` listesinde yeni satır var mı?
- ✅ `info@upgrademate.com` adresine bildirim e-postası geldi mi?
- ✅ Formda başarı mesajı göründü mü?
- ✅ Honeypot dolu gönderimde SharePoint'e kayıt YOK mu?

---

## Sorun Giderme

| Hata | Olası Neden | Çözüm |
|------|-------------|-------|
| 403 CAPTCHA failed | Turnstile secret yanlış | `TURNSTILE_SECRET_KEY` kontrol edin |
| 401 Graph token | App kayıt veya izin sorunu | Admin consent verildi mi? |
| 403 SharePoint | `Sites.ReadWrite.All` izni eksik | API permissions kontrol edin |
| 403 Mail.Send | İzin eksik veya yanlış UPN | `SENDER_EMAIL` Exchange'de var mı? |
| CORS hatası | `ALLOWED_ORIGIN` yanlış | Origin tam URL eşleşmeli (/ olmadan) |
| 500 Server error | Log inceleyin | Azure Portal → Function → Monitor |
