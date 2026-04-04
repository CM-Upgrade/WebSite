# TryNow Formu Kurulum Rehberi

> **Mimari:** Azure Functions (Node.js) + Microsoft Graph API + Cloudflare Turnstile
> **Maliyet:** Ücretsiz (M365 E3 dahili + Azure free tier + Cloudflare free)
> **Power Automate Premium gerektirmez.**

---

## Genel Akış

```
Kullanıcı (trynow/index.html)
  │  form gönder + Turnstile token
  ▼
Cloudflare (upgrademate.io)
  │  DDoS filtre, Rate Limit, bot engel
  ▼
Azure Functions  /api/trynow
  │  ① Turnstile token doğrula (Cloudflare API)
  │  ② Honeypot kontrolü
  │  ③ Alan doğrulama
  │  ④ Graph API token al
  │  ⑤ SharePoint'e kaydet
  │  ⑥ E-posta bildir (Exchange Online)
  ▼
Exchange Online → info@upgrademate.com
SharePoint List → TrialRequests
```

---

## Ön Gereksinimler

- Azure hesabı (portal.azure.com) — M365 E3 ile birlikte gelir
- Cloudflare hesabı — ücretsiz (dash.cloudflare.com)
- Node.js 20 LTS (local geliştirme için)
- Azure Functions Core Tools v4 (local test için)
- Git

> **Not:** Contact formu zaten kuruluysa **ADIM 1, 3, 4** (Azure AD App,
> Cloudflare Turnstile, Functions projesi) tamamlanmıştır — atlayın.
> Yapmanız gereken: ADIM 2 (SharePoint listesi) + ADIM 5 (TryNow function kodu).

---

## ADIM 1: Azure AD Uygulama Kaydı

> ⚠️ Contact formu için zaten yaptıysanız bu adımı atlayın.

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
3. Liste adı: `TrialRequests`
4. Şu sütunları ekleyin (**+ Add column** ile):

| Sütun Adı      | Tür                 | Açıklama                    |
|----------------|---------------------|-----------------------------|
| FirstName      | Single line of text |                             |
| LastName       | Single line of text |                             |
| Email          | Single line of text |                             |
| CompanyName    | Single line of text |                             |
| SccmSiteCode   | Single line of text | 3 karakter, büyük harf      |
| SccmSupportId  | Single line of text |                             |
| ComputerCount  | Single line of text |                             |
| WindowsVersion | Single line of text | Örn: W11 24H2               |
| SubmittedAt    | Single line of text | ISO 8601 timestamp          |
| Status         | Single line of text | Varsayılan: "New"           |

**SharePoint Site ID ve List ID'yi almak:**

Graph Explorer (aka.ms/ge) üzerinde:
```
GET https://graph.microsoft.com/v1.0/sites/[tenant].sharepoint.com:/sites/[site]
```
Dönen JSON'dan `id` → `SHAREPOINT_SITE_ID`

```
GET https://graph.microsoft.com/v1.0/sites/{siteId}/lists
```
`TrialRequests` listesinin `id`'si → `TRYNOW_LIST_ID`

---

## ADIM 3: Cloudflare Turnstile

> ⚠️ Contact formu için zaten yaptıysanız aynı site key'i kullanabilirsiniz.

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
- Rule: `/api/trynow` → 3 istek / 10 dakika / IP başına → Block 10 dakika
  *(TryNow daha kritik: aynı IP'den çok deneme şüphelidir)*

---

## ADIM 4: Azure Functions Projesi

> ⚠️ Contact formu için zaten `upgrademate-api` reposu varsa bu adımı atlayın.
> Sadece `api/trynow/` klasörünü ekleyin.

```bash
mkdir upgrademate-api && cd upgrademate-api
func init --worker-runtime node --language javascript
git init
```

**Klasör yapısı (her iki form birlikte):**
```
upgrademate-api/
├── api/
│   ├── contact/
│   │   ├── index.js
│   │   └── function.json
│   ├── trynow/                ← bu form
│   │   ├── index.js
│   │   └── function.json
│   └── _shared/
│       ├── graphAuth.js
│       └── turnstile.js
├── host.json
├── local.settings.json        ← git'e GİRMEZ
└── package.json
```

**`api/trynow/function.json`**:
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

**Ortak dosyalar** (`_shared/graphAuth.js`, `_shared/turnstile.js`) Contact formu dokumanındaki ile aynıdır.

---

## ADIM 5: TryNow Function Kodu

**`api/trynow/index.js`**
```javascript
const { getGraphToken }   = require('../_shared/graphAuth');
const { verifyTurnstile } = require('../_shared/turnstile');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  process.env.ALLOWED_ORIGIN || 'https://upgrademate.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const VALID_WINDOWS_VERSIONS = [
  'W10 21H2', 'W10 22H2',
  'W11 21H2', 'W11 22H2', 'W11 23H2', 'W11 24H2'
];

module.exports = async function (context, req) {

  // CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: CORS_HEADERS };
    return;
  }

  const body = req.body;

  // ① Honeypot — bot tuzağı
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
  const {
    firstName, lastName, email, companyName,
    sccmSiteCode, sccmSupportId, computerCount, windowsVersion
  } = body || {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const siteCodeRegex = /^[A-Za-z0-9]{3}$/;

  const errors = [];
  if (!firstName?.trim())  errors.push('firstName required');
  if (!lastName?.trim())   errors.push('lastName required');
  if (!email?.trim() || !emailRegex.test(email.trim())) errors.push('valid email required');
  if (!companyName?.trim()) errors.push('companyName required');
  if (!sccmSiteCode?.trim() || !siteCodeRegex.test(sccmSiteCode.trim())) errors.push('sccmSiteCode: 3 chars required');
  if (!sccmSupportId?.trim()) errors.push('sccmSupportId required');
  if (!computerCount || parseInt(computerCount) < 1) errors.push('computerCount >= 1 required');
  if (!VALID_WINDOWS_VERSIONS.includes(windowsVersion)) errors.push('invalid windowsVersion');

  if (errors.length > 0) {
    context.res = { status: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: errors.join(', ') }) };
    return;
  }

  const cleanData = {
    firstName:      firstName.trim(),
    lastName:       lastName.trim(),
    email:          email.trim().toLowerCase(),
    companyName:    companyName.trim(),
    sccmSiteCode:   sccmSiteCode.trim().toUpperCase(),
    sccmSupportId:  sccmSupportId.trim(),
    computerCount:  String(parseInt(computerCount)),
    windowsVersion: windowsVersion
  };

  try {
    const token = await getGraphToken();
    await Promise.all([
      saveToSharePoint(token, cleanData),
      sendNotificationEmail(token, cleanData)
    ]);
    context.res = { status: 200, headers: CORS_HEADERS, body: JSON.stringify({ status: 'success' }) };
  } catch (err) {
    context.log.error('TryNow form error:', err);
    context.res = { status: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Server error' }) };
  }
};

async function saveToSharePoint(token, data) {
  const url = `https://graph.microsoft.com/v1.0/sites/${process.env.SHAREPOINT_SITE_ID}/lists/${process.env.TRYNOW_LIST_ID}/items`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        FirstName:      data.firstName,
        LastName:       data.lastName,
        Email:          data.email,
        CompanyName:    data.companyName,
        SccmSiteCode:   data.sccmSiteCode,
        SccmSupportId:  data.sccmSupportId,
        ComputerCount:  data.computerCount,
        WindowsVersion: data.windowsVersion,
        SubmittedAt:    new Date().toISOString(),
        Status:         'New'
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
        subject: `New Trial Request — ${data.firstName} ${data.lastName} (${data.companyName})`,
        body: {
          contentType: 'HTML',
          content: `
            <h2>New Trial Request</h2>
            <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse">
              <tr><td><strong>Name</strong></td><td>${data.firstName} ${data.lastName}</td></tr>
              <tr><td><strong>Email</strong></td><td>${data.email}</td></tr>
              <tr><td><strong>Company</strong></td><td>${data.companyName}</td></tr>
              <tr><td><strong>SCCM Site Code</strong></td><td>${data.sccmSiteCode}</td></tr>
              <tr><td><strong>SCCM Support ID</strong></td><td>${data.sccmSupportId}</td></tr>
              <tr><td><strong>Computer Count</strong></td><td>${data.computerCount}</td></tr>
              <tr><td><strong>Windows Version</strong></td><td>${data.windowsVersion}</td></tr>
              <tr><td><strong>Submitted</strong></td><td>${new Date().toISOString()}</td></tr>
            </table>
            <p style="margin-top:16px">
              <a href="${process.env.SHAREPOINT_SITE_URL}/Lists/TrialRequests">
                SharePoint'te görüntüle →
              </a>
            </p>
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

## ADIM 6: Ortam Değişkenleri

**`local.settings.json`** (`CONTACT_LIST_ID` zaten ekliydiyse sadece `TRYNOW_LIST_ID` ekleyin):
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
    "SHAREPOINT_SITE_URL":    "https://[tenant].sharepoint.com/sites/[site]",
    "CONTACT_LIST_ID":        "xxxx-xxxx-xxxx-xxxx",
    "TRYNOW_LIST_ID":         "xxxx-xxxx-xxxx-xxxx",
    "SENDER_EMAIL":           "info@upgrademate.com",
    "NOTIFICATION_EMAIL":     "info@upgrademate.com",
    "ALLOWED_ORIGIN":         "http://localhost:3000"
  }
}
```

**Azure Portal'da production** (Function App → Configuration → Application settings):
- `TRYNOW_LIST_ID` = SharePoint `TrialRequests` liste GUID'i
- `SHAREPOINT_SITE_URL` = `https://[tenant].sharepoint.com/sites/[site]`
- Diğer değişkenler Contact formu kurulumunda zaten eklendi

---

## ADIM 7: Deploy

```bash
# Projeyi deploy et (yeniden)
func azure functionapp publish upgrademate-api
```

TryNow endpoint: `https://upgrademate-api.azurewebsites.net/api/trynow`

---

## ADIM 8: HTML Formunu Güncelleme

`trynow/index.html` içinde değiştirilecekler:

1. Cloudflare Turnstile script'i `<head>`'e ekle:
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

2. Form içine Turnstile widget ekle (submit butonunun üstüne):
```html
<div class="cf-turnstile" data-sitekey="TURNSTILE_SITE_KEY_BURAYA" data-theme="dark"></div>
```

3. Form submit JS'i güncelle:
```javascript
const API_URL = 'https://upgrademate-api.azurewebsites.net/api/trynow';

// fetch çağrısında payload:
const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
const payload = {
  firstName, lastName, email, companyName,
  sccmSiteCode, sccmSupportId, computerCount, windowsVersion,
  'cf-turnstile-response': turnstileToken,
  _hp: ''
};
```

4. Tüm client-side spam kontrollerini (honeypot JS, timing, sessionStorage rate limit) kaldır.
5. `generateToken()` fonksiyonunu kaldır — artık Turnstile token kullanılıyor.

---

## ADIM 9: Test

```bash
# Local test
func start

curl -X POST http://localhost:7071/api/trynow \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@company.com",
    "companyName": "Test Corp",
    "sccmSiteCode": "XYZ",
    "sccmSupportId": "SUP-12345",
    "computerCount": "500",
    "windowsVersion": "W11 24H2",
    "cf-turnstile-response": "XXXXX"
  }'
```

> Local test için Turnstile bypass: `TURNSTILE_SECRET_KEY` = `1x0000000000000000000000000000000AA`

Kontrol edin:
- ✅ SharePoint `TrialRequests` listesinde yeni satır, Status = "New"
- ✅ `info@upgrademate.com` adresine tablo formatında bildirim geldi mi?
- ✅ SCCM Site Code büyük harfe çevrildi mi?
- ✅ Geçersiz Windows version ile gönderim reddedildi mi?
- ✅ Honeypot dolu gönderimde kayıt YOK mu?

---

## Sorun Giderme

| Hata | Olası Neden | Çözüm |
|------|-------------|-------|
| 403 Verification failed | Turnstile token yanlış/eksik | HTML'de widget var mı? TURNSTILE_SECRET_KEY doğru mu? |
| 400 invalid windowsVersion | Seçenek listesi eşleşmiyor | `VALID_WINDOWS_VERSIONS` dizisini HTML select ile eşleştirin |
| 403 SharePoint | `Sites.ReadWrite.All` izni eksik | Azure AD admin consent verildi mi? |
| 403 Mail.Send | İzin eksik veya UPN yanlış | `SENDER_EMAIL` Exchange'de aktif posta kutusu mu? |
| CORS hatası | `ALLOWED_ORIGIN` yanlış | Tam URL (trailing slash olmadan) |
| 500 Server error | Log inceleyin | Azure Portal → Function App → Monitor → Logs |
