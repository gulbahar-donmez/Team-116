# PostureGuard Mobile - React Native Uygulaması

PostureGuard web uygulamasının React Native mobil versiyonu. AI destekli postur analizi ve gerçek zamanlı takip özelliklerine sahiptir.

## 🚀 Kurulum

### Ön Gereksinimler

1. **Node.js** (v16 veya üzeri)
2. **npm** veya **yarn**
3. **Expo CLI**
4. **Android Studio** (Android geliştirme için)
5. **Xcode** (iOS geliştirme için - sadece macOS)

### Adım 1: Expo CLI Kurulumu

```bash
npm install -g expo-cli
```

### Adım 2: Proje Kurulumu

```bash
# Proje dizinine git
cd PostureGuardMobile

# Bağımlılıkları yükle
npm install

# veya yarn kullanıyorsanız
yarn install
```

### Adım 3: Expo Go Uygulamasını İndirin

- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### Adım 4: Uygulamayı Çalıştırın

```bash
# Geliştirme sunucusunu başlat
npm start

# veya
expo start
```

QR kodu telefonunuzla tarayın ve uygulamayı Expo Go'da açın.

## 🔧 Yapılandırma

### Backend API Bağlantısı

`src/services/AuthService.js` ve `src/services/PostureService.js` dosyalarında API_BASE_URL'i güncelleyin:

```javascript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:8000'; // Backend IP adresinizi yazın
```

**Önemli**: `localhost` yerine gerçek IP adresinizi kullanın (örn: `192.168.1.100:8000`)

### Kamera İzinleri

Uygulama kamera erişimi gerektirir. `app.json` dosyasında izinler zaten tanımlanmıştır.

## 📱 Özellikler

### ✅ Tamamlanan Özellikler

- **Kullanıcı Kimlik Doğrulama**: Giriş/Kayıt sistemi
- **Dashboard**: İstatistikler ve grafikler
- **Canlı Postur Analizi**: Gerçek zamanlı kamera analizi
- **Fotoğraf Yükleme**: Galeri/kamera ile fotoğraf analizi
- **Kalibrasyon**: Kişiselleştirilmiş ayarlar
- **Profil Yönetimi**: Kullanıcı ayarları ve çıkış

### 🔄 Web'den Mobil'e Geçiş Haritası

| Web Özelliği | Mobil Karşılığı | Durum |
|--------------|-----------------|--------|
| React Router | React Navigation | ✅ |
| Tailwind CSS | StyleSheet/LinearGradient | ✅ |
| Axios API | Axios (aynı) | ✅ |
| Chart.js | React Native Chart Kit | ✅ |
| Three.js | React Native SVG | ⚠️ Basitleştirildi |
| Google OAuth | Expo Auth Session | 🔄 Geliştirilecek |
| PDF Export | React Native PDF | 🔄 Geliştirilecek |

## 🏗️ Proje Yapısı

```
PostureGuardMobile/
├── App.js                 # Ana uygulama bileşeni
├── app.json              # Expo yapılandırması
├── package.json          # Bağımlılıklar
└── src/
    ├── screens/          # Ekran bileşenleri
    │   ├── LoginScreen.js
    │   ├── DashboardScreen.js
    │   ├── LiveAnalysisScreen.js
    │   ├── UploadScreen.js
    │   ├── ProfileScreen.js
    │   └── CalibrationScreen.js
    ├── services/         # API servisleri
    │   ├── AuthService.js
    │   └── PostureService.js
    └── theme/
        └── theme.js      # Tema ve stiller
```

## 🔧 Geliştirme

### Yeni Ekran Ekleme

1. `src/screens/` klasöründe yeni dosya oluşturun
2. `App.js` dosyasında navigation'a ekleyin
3. Gerekli import'ları yapın

### API Endpoint Ekleme

1. İlgili service dosyasında yeni method ekleyin
2. Error handling ekleyin
3. TypeScript tip tanımları ekleyin (opsiyonel)

### Stil Güncellemeleri

`src/theme/theme.js` dosyasında global stilleri güncelleyin.

## 📦 Build ve Yayınlama

### Android APK Build

```bash
expo build:android
```

### iOS Build

```bash
expo build:ios
```

### Standalone App

```bash
# Android
expo build:android -t apk

# iOS
expo build:ios -t archive
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

1. **Metro bundler hatası**: 
   ```bash
   expo r -c
   ```

2. **Cache temizleme**:
   ```bash
   expo start -c
   ```

3. **Node modules yeniden yükleme**:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Backend Bağlantı Sorunları

- IP adresinin doğru olduğundan emin olun
- Firewall ayarlarını kontrol edin
- Backend sunucusunun çalıştığından emin olun

## 🔒 Güvenlik

- API anahtarları `.env` dosyasında saklayın
- Hassas veriler için `expo-secure-store` kullanın
- HTTPS kullanın (production'da)

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 Destek

Herhangi bir sorun için:
- GitHub Issues açın
- Email: support@postureguard.com

---

**Not**: Bu uygulama PostureGuard web uygulamasının mobil versiyonudur ve aynı backend API'yi kullanır.
