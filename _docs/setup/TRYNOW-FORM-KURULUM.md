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
Azure Functions  /api/trynow
  │  ① Honeypot kontrolü
  │  ② Turnstile token doğrula (Cloudflare API)
  │  ③ Alan doğrulama
  │  ④ Graph API token al
  │  ⑤ SccmSupportId duplicate kontrolü (aynı ID → 409)
  │  ⑥ SharePoint'e kaydet  +  E-posta bildir (paralel)
  ▼
Başarı  → thank-you/?status=success&type=trynow
409     → thank-you/?status=error&type=trial-exists
Hata    → thank-you/?status=error&type=trynow

Exchange Online → murat@trz-tech.com   (from: info@upgrademate.io)
SharePoint List → TrialRequests
```

---

## Ön Gereksinimler

- Contact formu kurulumu tamamlanmış olmalı
  (Azure AD App, Azure Functions, Cloudflare Turnstile hazır)
- Sadece ADIM 2 (SharePoint) + ADIM 5 (TryNow kodu) yapılacak

---

## ADIM 1: Azure AD Uygulama Kaydı

> ✅ Contact formu için zaten yapıldı — atlayın.

---

## ADIM 2: SharePoint Listesi

1. SharePoint sitenize gidin → **Site contents** → **+ New** → **List**
2. Liste adı: `TrialRequests`
3. Sütunları ekleyin:

| Sütun Adı      | Tür                 | Not                        |
|----------------|---------------------|----------------------------|
| FirstName      | Single line of text |                            |
| LastName       | Single line of text |                            |
| Email          | Single line of text |                            |
| CompanyName    | Single line of text |                            |
| SccmSiteCode   | Single line of text | 3 karakter, büyük harfe çevrilir |
| SccmSupportId  | Single line of text | **Index eklenecek** (aşağıya bakın) |
| ComputerCount  | Single line of text |                            |
| WindowsVersion | Single line of text | Örn: W11 24H2              |
| SubmittedAt    | Single line of text | ISO 8601 timestamp         |
| Status         | Single line of text | Varsayılan: "New"          |

**SccmSupportId sütununu indexleyin** (duplicate kontrol için zorunlu):
- Liste → **⚙ Settings** → **List settings** → **Indexed columns** → **Create a new index**
- Primary column: `SccmSupportId` → **Create**

**List ID'yi Graph Explorer'dan almak (aka.ms/ge):**
```
GET https://graph.microsoft.com/v1.0/sites/{siteId}/lists/TrialRequests
→ "id" alanı → TRYNOW_LIST_ID
```

---

## ADIM 3: Cloudflare Turnstile

> ✅ Contact formu için zaten yapıldı — aynı site key kullanılır.

**Production'da Cloudflare Rate Limiting** (upgrademate.io Cloudflare'e taşınınca):
- Dashboard → **Security** → **WAF** → **Rate limiting rules**
- Rule: `/api/trynow` → 3 istek / 10 dakika / IP → Block 10 dakika

---

## ADIM 4: Azure Functions Projesi

> ✅ Contact formu için zaten kuruldu — sadece `trynow/` klasörü eklenir.

Klasör yapısı:
```
upgrademate-api/
├── contact/          ← mevcut
├── trynow/           ← YENİ
│   ├── index.js
│   └── function.json
├── _shared/          ← mevcut (ortak)
├── host.json
└── local.settings.json
```

---

## ADIM 5: TryNow Function Kodu

**`trynow/function.json`:**
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

**`trynow/index.js`:** — mevcut kodu kullanın (gerçek kaynak: `c:\Repos\upgrademate-api\trynow\index.js`)

Önemli notlar:
- Mail subject: `New Trial Request — {ad} {soyad} ({şirket})`
- `toRecipients`: `NOTIFICATION_EMAIL` (murat@trz-tech.com)
- `from`: `SENDER_EMAIL` (info@upgrademate.io)
- **Duplicate kontrol:** `checkExistingTrial()` → aynı `SccmSupportId` varsa `409` döner
- SharePoint alanları: `FirstName, LastName, Email, CompanyName, SccmSiteCode, SccmSupportId, ComputerCount, WindowsVersion, SubmittedAt, Status`

---

## ADIM 6: Ortam Değişkenleri

`local.settings.json`'a eklenecek (mevcut Contact değişkenlerine ek):
```json
{
  "Values": {
    "TRYNOW_LIST_ID": "xxxx-xxxx-xxxx-xxxx"
  }
}
```

**Azure Portal'a eklenecek:**

| Değişken | Değer |
|---|---|
| `TRYNOW_LIST_ID` | TrialRequests liste GUID'i |

Diğer tüm değişkenler Contact formu kurulumunda zaten eklendi.

---

## ADIM 7: Deploy

```bash
cd upgrademate-api
func azure functionapp publish upgrademate-api
```

> Azure Portal CORS ayarı zaten Contact formunda yapıldıysa tekrar gerekmez.

**Endpoint URL:** `https://upgrademate-api-[hash].westeurope-01.azurewebsites.net/api/trynow`

---

## ADIM 8: HTML Formunu Güncelleme

`trynow/index.html` içinde:

1. `<head>`'e Turnstile script (Contact formuyla aynı):
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

2. Submit butonunun üstüne Turnstile widget:
```html
<div class="cf-turnstile" data-sitekey="TURNSTILE_SITE_KEY" data-theme="dark"></div>
```

3. Submit JS:
```javascript
const API_URL = 'https://upgrademate-api-[hash].westeurope-01.azurewebsites.net/api/trynow';

const payload = {
  firstName, lastName, email, companyName,
  sccmSiteCode, sccmSupportId, computerCount, windowsVersion,
  'cf-turnstile-response': turnstile.getResponse(),
  _hp: honeypotInput.value
};

// Başarı   → ../thank-you/?status=success&type=trynow
// 409      → ../thank-you/?status=error&type=trial-exists
// Hata     → ../thank-you/?status=error&type=trynow
```

---

## ADIM 9: Local Test

Azurite ve `func start` çalışıyorken:

```powershell
# İlk gönderim — başarılı olmalı
Invoke-RestMethod -Method POST -Uri "http://localhost:7071/api/trynow" `
  -ContentType "application/json" `
  -Body '{"firstName":"Test","lastName":"User","email":"test@co.com","companyName":"Test Corp","sccmSiteCode":"ABC","sccmSupportId":"SUP001","computerCount":"500","windowsVersion":"W11 24H2","cf-turnstile-response":"bypass","_hp":""}'

# Aynı SccmSupportId ile tekrar — 409 dönmeli
Invoke-RestMethod -Method POST -Uri "http://localhost:7071/api/trynow" `
  -ContentType "application/json" `
  -Body '{"firstName":"Test2","lastName":"User2","email":"test2@co.com","companyName":"Corp2","sccmSiteCode":"ABC","sccmSupportId":"SUP001","computerCount":"100","windowsVersion":"W11 24H2","cf-turnstile-response":"bypass","_hp":""}'
```

Kontrol edin:
- ✅ İlk gönderimde `{"status":"success"}` döndü mü?
- ✅ SharePoint `TrialRequests` listesinde yeni satır, Status = "New"?
- ✅ `murat@trz-tech.com` adresine mail geldi mi?
- ✅ SCCM Site Code büyük harfe çevrildi mi?
- ✅ İkinci gönderimde `409` hatası döndü mü?

---

## Sorun Giderme

| Hata | Neden | Çözüm |
|------|-------|-------|
| `OPTIONS` 400 CORS | Azure Portal CORS ayarı eksik | Function App → API → CORS → domain ekle |
| 403 Verification failed | Turnstile secret yanlış | local: `TURNSTILE_SKIP=true` ekle |
| 400 Missing fields | Alan adı uyuşmazlığı | payload key'lerini SharePoint iç adlarıyla eşleştir |
| 500 SharePoint filter error | SccmSupportId index eksik | Liste → Settings → Indexed columns → ekle |
| 409 her zaman dönüyor | Liste temizlenmedi | SharePoint'te test kayıtlarını sil |
| 403 SharePoint | Sites.ReadWrite.All eksik | API permissions → admin consent |
