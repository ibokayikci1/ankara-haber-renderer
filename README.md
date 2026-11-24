# Ankara'da Ne Yapalım? — HTML/CSS Haber Görseli

## İçerik
- `public/template.html` — 1080 × 1350 sabit tasarım (lacivert/kırmızı)
- `public/logo.png` — yüklediğiniz özgün logo
- `server.js` — Express + Playwright görsel oluşturma API'si
- `Dockerfile` — Docker ile çalıştırmak için
- `ornek-onizleme.png` — örnek, gerçek haber değildir

## Çalıştırma
Docker destekleyen bir sunucuya bu klasörü yükleyin. `RENDER_API_KEY` ortam değişkenini güçlü ve gizli bir değere ayarlayın. Docker image'ı oluşturup çalıştırın, HTTPS üzerinden sunun.

Örnek yerel komutlar:
```
docker build -t ankara-haber-renderer .
docker run --rm -p 3000:3000 -e RENDER_API_KEY='UZUN_GIZLI_ANAHTAR' ankara-haber-renderer
```

`GET /health` servis kontrolü, `POST /render` PNG üretimidir. `POST /render` için `X-API-Key` header'ı zorunludur. `photo_data_uri` yalnızca kullanma hakkınız olan gerçek JPEG/PNG/WEBP haber fotoğrafı için base64 data URI kabul eder. Görsel olmadan haber fotoğrafı uydurulmaz.

Örnek POST JSON:
```
{
 "kategori":"ULAŞIM",
 "baslik":"Ankara'da ulaşımı etkileyen gelişme",
 "alt_baslik":"Doğrulanmış kısa haber açıklaması",
 "kaynak_adi":"Kaynak adı",
 "tarih":"24.11.2026",
 "fotograf_kredisi":"Fotoğraf hakkı sahibinin adı",
 "photo_data_uri":"data:image/jpeg;base64,..."
}
```

Başlık ve ayrıntıları sadece doğrulanmış verilerden üretin. Claude'un puanlaması haber doğrulamasının yerine geçmez. Yayın öncesinde Telegram onayı olmalıdır. API'yi herkese açık anahtarsız çalıştırmayın.

## n8n bağlantısı
Kod düğümünüzden sonra bir `HTTP Request` düğümü ekleyin. Yöntem `POST`, URL `https://SIZIN-SUNUCUNUZ/render`, header `X-API-Key` (güvenli kimlik bilgisi ile), `Body Content Type: JSON`, `Response Format: File` ve `Put Output in Field: data`. JSON'a yukarıdaki alanları n8n expression olarak ekleyin. `photo_data_uri` ancak lisanslı haber fotoğrafı edinildikten sonra sağlanabilir.

## Not
Bu tasarımda Arial/DejaVu Sans güvenli sistem fontu kullanılır. Montserrat/Inter istenirse kullanım hakkı olan font dosyaları özel kurulumda eklenebilir; üçüncü taraf fontları pakete dahil etmedik.
