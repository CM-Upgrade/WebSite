# Power Automate + SharePoint İletişim Formu Kurulum Rehberi

> M365 E3 lisansı ile ek maliyet olmadan çalışır.

---

## ADIM 1: SharePoint Listesi Oluşturma

1. **SharePoint** sitenize gidin (veya yeni bir site oluşturun)
2. Sol menüden **"Site içerikleri"** (Site contents) tıklayın
3. **"+ Yeni" → "Liste"** (List) seçin
4. Liste adı: **ContactFormSubmissions** yazın
5. Listeyi oluşturduktan sonra şu sütunları ekleyin:

   | Sütun Adı     | Tür               |
   |---------------|--------------------|
   | FirstName     | Tek satır metin    |
   | LastName      | Tek satır metin    |
   | Email         | Tek satır metin    |
   | CompanyName   | Tek satır metin    |
   | Message       | Çok satırlı metin  |
   | SubmittedAt   | Tek satır metin    |

   > Her sütun için: **"+ Sütun ekle"** → uygun türü seçin → adı yazın → Kaydet

---

## ADIM 2: Power Automate Akışı Oluşturma

1. **https://make.powerautomate.com** adresine gidin
2. Sol menüden **"+ Oluştur"** (Create) tıklayın
3. **"Anında bulut akışı"** (Instant cloud flow) seçin
4. Akış adı: **ContactFormHandler** yazın
5. Tetikleyici olarak **"Bir HTTP isteği alındığında"** seçin
   (When an HTTP request is received)
6. **"Oluştur"** butonuna basın

---

## ADIM 3: HTTP Trigger Yapılandırma

1. Açılan **"Bir HTTP isteği alındığında"** kutusuna tıklayın
2. **"İstek Gövdesi JSON Şeması"** alanına şunu yapıştırın:

```json
{
  "type": "object",
  "properties": {
    "firstName":   { "type": "string" },
    "lastName":    { "type": "string" },
    "email":       { "type": "string" },
    "companyName": { "type": "string" },
    "message":     { "type": "string" },
    "_timestamp":  { "type": "string" },
    "_hp":         { "type": "string" },
    "_token":      { "type": "string" }
  },
  "required": ["firstName", "email", "companyName", "message"]
}
```

3. **"Yöntem"** (Method) kısmını **POST** olarak seçin

> ÖNEMLİ: Akışı kaydettikten sonra bu kutunun üstünde bir URL görünecek.
> Bu URL'yi en son adımda HTML formuna yapıştıracaksınız.

---

## ADIM 4: Spam Koruması - Koşul Ekleme

### 4a: Honeypot Kontrolü

1. **"+ Yeni adım"** tıklayın
2. **"Koşul"** (Condition) arayın ve seçin
3. Koşulu şöyle ayarlayın:
   - Sol kutu: Dinamik içerikten **_hp** seçin
   - Operatör: **eşittir** (is equal to)
   - Sağ kutu: boş bırakın (hiçbir şey yazmayın)
4. Bu koşul şu anlama gelir: "Honeypot alanı boşsa devam et" (botlar bu gizli alanı doldurur)

### 4b: "Evet" (If yes) Koluna Geçin

Koşulun **"Evet"** tarafına aşağıdaki adımları ekleyeceksiniz.
**"Hayır"** tarafını tamamen boş bırakın (bot gönderimlerini sessizce yok sayar).

---

## ADIM 5: SharePoint'e Kaydetme (Evet kolunda)

1. **"Evet"** kutusunun içinde **"Eylem ekle"** tıklayın
2. **"SharePoint - Öğe oluştur"** (Create item) arayın ve seçin
3. Alanları doldurun:
   - **Site Adresi**: SharePoint sitenizi seçin
   - **Liste Adı**: ContactFormSubmissions seçin
   - Sütun eşleştirmeleri (dinamik içerikten seçin):
     - FirstName   → **firstName**
     - LastName    → **lastName**
     - Email       → **email**
     - CompanyName → **companyName**
     - Message     → **message**
     - SubmittedAt → **_timestamp**

---

## ADIM 6: E-posta Bildirimi (Evet kolunda)

1. SharePoint adımının altında **"Eylem ekle"** tıklayın
2. **"Office 365 Outlook - E-posta gönder (V2)"** arayın ve seçin
3. Alanları doldurun:
   - **Kime**: kendi e-posta adresiniz
   - **Konu**: `Yeni İletişim Formu - ` ve dinamik içerikten **firstName** ekleyin
   - **Gövde**: Aşağıdaki gibi düzenleyin:

```
Yeni bir iletişim formu gönderimi aldınız.

Ad: [firstName] [lastName]
E-posta: [email]
Şirket: [companyName]

Mesaj:
[message]

Gönderim zamanı: [_timestamp]
```

   > Köşeli parantezli alanları "Dinamik içerik" panelinden sürükleyerek ekleyin.

---

## ADIM 7: HTTP Yanıtı (Evet kolunda)

1. E-posta adımının altında **"Eylem ekle"** tıklayın
2. **"İstek - Yanıt"** (Response) arayın ve seçin
3. Alanları doldurun:
   - **Durum Kodu**: 200
   - **Gövde**:
```json
{ "status": "success", "message": "Mesajınız alındı." }
```

---

## ADIM 8: Akışı Kaydetme ve URL Alma

1. Üstten **"Kaydet"** butonuna basın
2. En üstteki **"Bir HTTP isteği alındığında"** kutusuna tekrar tıklayın
3. **"HTTP POST URL"** alanında uzun bir URL göreceksiniz:
   `https://prod-XX.westeurope.logic.azure.com:443/workflows/...`
4. **Bu URL'yi kopyalayın** — HTML formunda kullanacaksınız

---

## ADIM 9: HTML Formuna URL'yi Yapıştırma

`contact-form-azure.html` dosyasında şu satırı bulun:

```javascript
const FLOW_URL = 'BURAYA_POWER_AUTOMATE_URL_YAPISTIRIN';
```

Kopyaladığınız URL'yi buraya yapıştırın ve dosyayı kaydedin.

---

## ADIM 10: Test Etme

1. HTML dosyasını tarayıcıda açın
2. Formu doldurun ve gönderin
3. Kontrol edin:
   - ✅ SharePoint listesinde yeni satır var mı?
   - ✅ E-postanıza bildirim geldi mi?
   - ✅ Formda başarı mesajı göründü mü?

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| CORS hatası | Power Automate Response adımında Header olarak `Access-Control-Allow-Origin: *` ekleyin |
| 401/403 hatası | Akışın "Erişimi olan" ayarını kontrol edin |
| E-posta gelmiyor | Outlook bağlantısını Power Automate'te yeniden yetkilendirin |
| SharePoint'e yazmıyor | Liste sütun adlarının birebir eşleştiğini kontrol edin |
| Akış tetiklenmiyor | Akışın "Açık" (On) durumda olduğunu kontrol edin |
