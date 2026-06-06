# Railway Deploy Notları

## Railway Variables

- `TOKEN` (zorunlu)
- `GUILD_ID` (zorunlu; komutların kayıt olacağı sunucu)
- `BOT_SES_KANAL_ID` (opsiyonel)
- `ERROR_LOG` (opsiyonel; hata log kanalı)
- `DB_JSON_PATH` (opsiyonel; kalıcı dosya yolu)
- `GUARD_YETKILI_ROL` (opsiyonel; guard yetkili rolü)

## Kalıcılık (puanlar resetlenmesin)

Railway redeploy/restart sırasında dosya sistemi sıfırlanabilir. Kalıcılık için bir **Volume** bağlayıp DB dosyasını oraya yönlendir.

Örnek:

- Volume mount: `/data`
- Variable: `DB_JSON_PATH=/data/database.json`

## Bot davet linki

Botu sunucuya eklerken OAuth2 scope:

- `bot`
- `applications.commands`

## Ayar yönetimi

Sunucu içinden yönetmek için:

- `/ayarlar set key:KANAL_TARIKH value:<kanalId>`
- `/ayarlar set key:KANAL_AKTIF value:<kanalId>`
- `/ayarlar set key:KANAL_TOPLAM value:<kanalId>`

Bu değerler `settings.json` içine yazılır ve `config.json` üzerine override eder.

## “Güncel kod deploy oldu mu?” kontrolü

Eğer Railway eski build’i çalıştırıyorsa `/debug` çıktısındaki `LoadedFiles` ve `DiskEvents` satırlarında eski dosyalar (örn. `logs.js`, `voiceCount.js`) görünür.

Doğru deploy için:

- Railway’de **Deploy** ekranında “Deploy latest commit” yap
- Gerekirse **Clear build cache** (Nixpacks cache) + redeploy
- Bot logunda `[BOOT] v=...` satırını gör ve `/debug` çıktısının repo ile aynı olduğundan emin ol
