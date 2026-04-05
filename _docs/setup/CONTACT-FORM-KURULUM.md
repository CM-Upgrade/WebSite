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
Azure Functions  /api/contact
  │  ① Honeypot kontrolü
  │  ② Turnstile token doğrula (Cloudflare API)
  │  ③ Alan doğrulama
  │  ④ Graph API token al
  │  ⑤ SharePoint'e kaydet  +  E-posta bildir (paralel)
  ▼
Başarı → thank-you/?status=success&type=contact
Hata   → thank-you/?status=error&type=contact

Exchange Online → murat@trz-tech.com   (from: info@upgrademate.io)
SharePoint List → ContactFormSubmissions
```

---

## Ön Gereksinimler

- Azure hesabı (portal.azure.com)
- Cloudflare hesabı (dash.cloudflare.com)
- Node.js 22 LTS
- Azure Functions Core Tools v4
- Azurite (local storage emulator)

---

## ADIM 1: Azure AD Uygulama Kaydı

> ⚠️ TryNow formu için zaten yaptıysanız bu adımı atlayın.

1. **portal.azure.com** → **Azure Active Directory** → **App registrations**
2. **New registration**:
   - Name: `UpgradeMate Form Handler`
   - Supported account types: **Single tenant**
   - Redirect URI: boş
3. **Register** → not edin:
   - **Application (client) ID** → `CLIENT_ID`
   - **Directory (tenant) ID** → `TENANT_ID`
4. **Certificates & secrets** → **New client secret**:
   - Description: `form-handler-secret`
   - Expires: 24 months
   - **Value'yu hemen kopyalayın** → `CLIENT_SECRET`
5. **API permissions** → **Add** → **Microsoft Graph** → **Application permissions**:
   - `Mail.Send`
   - `Sites.ReadWrite.All`
6. **Grant admin consent** → **Yes**

---

## ADIM 2: SharePoint Listesi

1. SharePoint sitenize gidin → **Site contents** → **+ New** → **List**
2. Liste adı: `ContactFormSubmissions`
3. Sütunları ekleyin:

| Sütun Adı   | Tür                    |
|-------------|------------------------|
| FirstName   | Single line of text    |
| LastName    | Single line of text    |
| Email       | Single line of text    |
| CompanyName | Single line of text    |
| Message     | Multiple lines of text |
| SubmittedAt | Single line of text    |

**ID'leri Graph Explorer'dan almak (aka.ms/ge):**

```
# Site ID
GET https://graph.microsoft.com/v1.0/sites/[tenant].sharepoint.com:/sites/[site]
→ "id" alanı → SHAREPOINT_SITE_ID

# List ID (önce Sites.ReadWrite.All delegated consent gerekir)
GET https://graph.microsoft.com/v1.0/sites/{siteId}/lists/ContactFormSubmissions
→ "id" alanı → CONTACT_LIST_ID
```

---

## ADIM 3: Cloudflare Turnstile

> ⚠️ TryNow formu için zaten yaptıysanız aynı site key'i kullanabilirsiniz.

1. **dash.cloudflare.com** → **Turnstile** → **Add site**
2. Ayarlar:
   - Site name: `UpgradeMate Forms`
   - Domain: `upgrademate.io`
   - Widget type: **Managed**
3. Oluşan değerleri not edin:
   - **Site Key** → HTML'e girer (public)
   - **Secret Key** → `TURNSTILE_SECRET_KEY` (private)
4. **Settings → Hostnames** → test ortamı domain'ini ekleyin (örn: `cm-upgrade.github.io`, `localhost`)

**Production'da Cloudflare Rate Limiting** (upgrademate.io Cloudflare'e taşınınca):
- Dashboard → **Security** → **WAF** → **Rate limiting rules**
- Rule: `/api/contact` → 5 istek / 1 dakika / IP → Block 1 dakika

---

## ADIM 4: Azure Functions Projesi

```bash
mkdir upgrademate-api && cd upgrademate-api
npm install -g azurite azure-functions-core-tools@4
```

**Klasör yapısı:**
```
upgrademate-api/
├── contact/
│   ├── index.js
│   └── function.json
├── trynow/
│   ├── index.js
│   └── function.json
├── _shared/
│   ├── graphAuth.js
│   └── turnstile.js
├── host.json
├── local.settings.json    ← git'e GİRMEZ
├── .gitignore
└── package.json
```

> ⚠️ Fonksiyonlar `api/` altında değil, **kök dizinde** olmalı.
> Azure Functions runtime yalnızca kök dizini tarar.

**`host.json`:**
```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

**`.gitignore`:**
```
node_modules/
local.settings.json
.env
__azurite_db_*.json
__blobstorage__/
AzuriteConfig
```

---

## ADIM 5: Ortak Yardımcı Dosyalar

**`_shared/graphAuth.js`**
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
  if (!data.access_token) throw new Error('Graph token alınamadı: ' + JSON.stringify(data));
  return data.access_token;
}

module.exports = { getGraphToken };
```

**`_shared/turnstile.js`**
```javascript
async function verifyTurnstile(token, ip) {
  if (!token) return false;
  if (process.env.TURNSTILE_SKIP === 'true') return true; // local test bypass
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

**`contact/function.json`:**
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

**`contact/index.js`:** — mevcut kodu kullanın (gerçek kaynak: `c:\Repos\upgrademate-api\contact\index.js`)

Önemli notlar:
- Mail subject: `New Message — {ad} {soyad} ({şirket})`
- `toRecipients`: `NOTIFICATION_EMAIL` (murat@trz-tech.com)
- `from`: `SENDER_EMAIL` (info@upgrademate.io)
- SharePoint alanları: `FirstName, LastName, Email, CompanyName, Message, SubmittedAt`

---

## ADIM 7: Ortam Değişkenleri

**`local.settings.json`** (git'e GİRMEZ):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage":      "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "TENANT_ID":                "xxxx-xxxx-xxxx-xxxx",
    "CLIENT_ID":                "xxxx-xxxx-xxxx-xxxx",
    "CLIENT_SECRET":            "xxxxxxxxxxxxxxxxxxxx",
    "TURNSTILE_SECRET_KEY":     "0x4AAAAAAA...",
    "TURNSTILE_SKIP":           "true",
    "SHAREPOINT_SITE_ID":       "tenant.sharepoint.com,xxxx,xxxx",
    "CONTACT_LIST_ID":          "xxxx-xxxx-xxxx-xxxx",
    "SENDER_EMAIL":             "info@upgrademate.io",
    "NOTIFICATION_EMAIL":       "murat@trz-tech.com",
    "ALLOWED_ORIGIN":           "*"
  }
}
```

> `TURNSTILE_SKIP=true` yalnızca local'de kullanılır, production'a eklenmez.
> `ALLOWED_ORIGIN=*` yalnızca local'de. Production'da domain yazılır.

**Azure Portal — production değişkenleri** (Function App → Environment variables):

| Değişken | Değer |
|---|---|
| `AzureWebJobsStorage` | Storage account connection string |
| `TENANT_ID` | Azure AD tenant ID |
| `CLIENT_ID` | App registration client ID |
| `CLIENT_SECRET` | App registration client secret |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `SHAREPOINT_SITE_ID` | `tenant.sharepoint.com,guid,guid` |
| `CONTACT_LIST_ID` | ContactFormSubmissions liste GUID |
| `SENDER_EMAIL` | `info@upgrademate.io` |
| `NOTIFICATION_EMAIL` | `murat@trz-tech.com` |
| `ALLOWED_ORIGIN` | `https://upgrademate.io` |

---

## ADIM 8: Azure Storage Account

> Azure Functions Consumption plan için gerekli.

1. **portal.azure.com** → **Create a resource** → **Storage account**
2. Ayarlar:
   - Resource group: `upgrademate-rg`
   - Name: `upgradematestorage`
   - Region: West Europe
   - Performance: Standard
   - Redundancy: LRS
3. Oluşunca: **Security + networking** → **Access keys** → **key1 Connection string** kopyalayın
4. Function App → **Environment variables** → `AzureWebJobsStorage` = connection string

---

## ADIM 9: Deploy

```bash
# Azure'a login
az login

# Deploy
cd upgrademate-api
func azure functionapp publish upgrademate-api
```

**Sonrası — Azure Portal CORS ayarı:**
- Function App → **API** → **CORS**
- Allowed Origins listesine ekleyin: `https://cm-upgrade.github.io` (test) ve `https://upgrademate.io` (prod)

> ⚠️ Azure Functions'ın kendi CORS katmanı kod içindeki CORS header'larından önce çalışır.
> Bu ayar yapılmadan preflight (`OPTIONS`) istekleri 400 döner.

**Endpoint URL:** `https://upgrademate-api-[hash].westeurope-01.azurewebsites.net/api/contact`

---

## ADIM 10: HTML Formunu Güncelleme

`contact/index.html` içinde:

1. `<head>`'e Turnstile script:
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

2. Submit butonunun üstüne Turnstile widget:
```html
<div class="cf-turnstile" data-sitekey="TURNSTILE_SITE_KEY" data-theme="dark"></div>
```

3. Submit JS:
```javascript
const API_URL = 'https://upgrademate-api-[hash].westeurope-01.azurewebsites.net/api/contact';

const turnstileToken = turnstile.getResponse();
if (!turnstileToken) { /* hata göster */ return; }

const payload = {
  firstName, lastName, email, companyName, message,
  'cf-turnstile-response': turnstileToken,
  _hp: honeypotInput.value   // boş = gerçek kullanıcı
};

// Başarı → ../thank-you/?status=success&type=contact
// Hata   → ../thank-you/?status=error&type=contact
```

---

## ADIM 11: Local Test

**Terminal 1 — Azurite:**
```bash
azurite --silent
```

**Terminal 2 — Functions:**
```bash
func start
# → contact: [POST,OPTIONS] http://localhost:7071/api/contact
```

**Terminal 3 — Test:**
```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:7071/api/contact" `
  -ContentType "application/json" `
  -Body '{"firstName":"Test","lastName":"User","email":"test@co.com","companyName":"Test Corp","message":"Bu bir test mesajıdır.","cf-turnstile-response":"bypass","_hp":""}'
```

Kontrol edin:
- ✅ `{"status":"success"}` döndü mü?
- ✅ SharePoint `ContactFormSubmissions` listesinde yeni satır var mı?
- ✅ `murat@trz-tech.com` adresine mail geldi mi?
- ✅ Mail konusu `New Message —` ile başlıyor mu?

---

## Sorun Giderme

| Hata | Neden | Çözüm |
|------|-------|-------|
| `OPTIONS` 400 CORS | Azure Portal CORS ayarı eksik | Function App → API → CORS → domain ekle |
| 403 Verification failed | Turnstile secret yanlış veya TURNSTILE_SKIP eksik | local: TURNSTILE_SKIP=true ekle |
| 401 Graph token | CLIENT_SECRET yanlış veya süresi dolmuş | App registration → secret kontrol |
| 403 SharePoint | Sites.ReadWrite.All izni eksik | API permissions → admin consent |
| 403 Mail.Send | İzin eksik veya SENDER_EMAIL yanlış | Graph izinleri + Exchange UPN |
| Storage unhealthy | AzureWebJobsStorage boş | Azurite başlat (local) veya connection string ekle (Azure) |
| No job functions found | Fonksiyonlar api/ altında | Kök dizine taşı |
