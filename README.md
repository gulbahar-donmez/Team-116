# 🚀 PostureGuard v8 - Kurulum ve Çalıştırma Rehberi

Bu, **PostureGuard** projesinin **yerel dizin** için teknik kurulum ve çalıştırma rehberidir.

> 📋 **Genel proje bilgileri, ekip detayları ve diğer versiyonlar için**: [Ana README](https://github.com/gulbahar-donmez/Team-116/blob/master/README.md)

## 🎯 Bu Versiyon Hakkında

PostureGuard, yapay zeka destekli duruş analizi uygulamasının **en güncel web versiyonudur**. Bu versiyon şunları içerir:

- ✅ **FastAPI Backend** - Modern Python web framework
- ✅ **React Frontend** - Responsive kullanıcı arayüzü  
- ✅ **PostgreSQL Database** - Güvenilir veri depolama
- ✅ **Redis Cache** - Hızlı oturum yönetimi
- ✅ **Docker Support** - Kolay deployment
- ✅ **AI Chatbot** - Google Gemini entegrasyonu
- ✅ **Real-time Analysis** - Canlı duruş takibi

## 📋 İçindekiler

- [Bu Versiyon Hakkında](#-bu-versiyon-hakkında)
- [Hızlı Başlangıç](#-hızlı-başlangıç)
- [Özellikler](#özellikler)
- [Teknoloji Stack](#teknoloji-stack)
- [Gereksinimler](#gereksinimler)
- [Kurulum](#kurulum)
  - [Docker ile Kurulum (Önerilen)](#docker-ile-kurulum-önerilen)
  - [Manuel Kurulum](#manuel-kurulum)
- [Çalıştırma](#çalıştırma)
- [API Endpoints](#api-endpoints)
- [Konfigürasyon](#konfigürasyon)
- [Sorun Giderme](#sorun-giderme)

## ⚡ Hızlı Başlangıç

```bash
# 1. Repository'yi klonlayın
git clone https://github.com/gulbahar-donmez/Team-116.git
cd Team-116/Posture_Guard_v8

# 2. Environment dosyasını oluşturun
cp .env.example .env

# 3. .env dosyasını düzenleyin (Google API keys gerekli)

# 4. Frontend'i build edin
cd frontend && npm install && npm run build && cd ..

# 5. Docker ile başlatın
docker-compose up -d

# 6. Database migration
docker-compose exec backend alembic upgrade head

# 7. Uygulamaya erişin
# Frontend: http://localhost:80
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 🔧 Teknik Özellikler
- **WebSocket Desteği**: Gerçek zamanlı veri iletişimi
- **Rate Limiting**: API güvenliği için istek sınırlama
- **Database Migration**: Alembic ile veritabanı sürüm kontrolü
- **Email Bildirimleri**: FastAPI-Mail ile email gönderimi

## 🛠 Teknoloji Stack

### Backend
- **FastAPI**: Modern, hızlı Python web framework
- **PostgreSQL**: Ana veritabanı
- **Redis**: Cache ve session yönetimi
- **SQLAlchemy**: ORM (Object-Relational Mapping)
- **Alembic**: Database migration tool
- **Google Generative AI**: AI chatbot için
- **LangChain**: AI uygulamaları için framework
- **Mediapipe**: Gerçek zamanlı duruş analizi
- **OpenCV**: Bilgisayar görü işlemleri

### Frontend
- **React 18**: Modern UI framework
- **Three.js**: 3D grafik ve animasyonlar
- **Chart.js**: Veri görselleştirme
- **React Router**: Sayfa yönlendirme
- **Tailwind CSS**: Styling framework
- **React OAuth**: Google kimlik doğrulama

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy ve static file serving

## 📋 Gereksinimler

### Sistem Gereksinimleri
- **Python**: 3.8+
- **Node.js**: 16+
- **PostgreSQL**: 13+
- **Redis**: 6+
- **Docker & Docker Compose** (önerilen)

### Donanım Gereksinimleri
- **RAM**: Minimum 4GB, önerilen 8GB+
- **CPU**: Multi-core processor önerilen
- **Webcam**: Gerçek zamanlı analiz için
- **Disk**: Minimum 2GB boş alan

## 🚀 Kurulum

### Docker ile Kurulum (Önerilen)

1. **Repository'yi klonlayın:**
```bash
git clone https://github.com/gulbahar-donmez/Team-116.git
cd Team-116
```

2. **Environment dosyasını oluşturun:**
```bash
cp .env.example .env
```

3. **`.env` dosyasını düzenleyin:**
```env
# Database
DATABASE_URL=postgresql://postureguard_user:postureguard_pass@db:5432/postureguard

# Redis
REDIS_URL=redis://redis:6379

# Google OAuth (Google Cloud Console'dan alınacak)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Generative AI
GOOGLE_API_KEY=your_google_gemini_api_key

# Email (İsteğe bağlı)
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com

# Environment
ENVIRONMENT=development
DEBUG=True
```

4. **Frontend'i build edin:**
```bash
cd frontend
npm install
npm run build
cd ..
```

5. **Docker containers'ları başlatın:**
```bash
docker-compose up -d
```

6. **Database migration'ını çalıştırın:**
```bash
docker-compose exec backend alembic upgrade head
```

### Manuel Kurulum

#### Backend Kurulumu

1. **Python virtual environment oluşturun:**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

2. **Python bağımlılıklarını yükleyin:**
```bash
pip install -r requirements.txt
```

3. **PostgreSQL ve Redis'i kurun ve başlatın:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql redis-server

# macOS (Homebrew)
brew install postgresql redis

# Windows - PostgreSQL ve Redis'i resmi websitelerinden indirin
```

4. **Database oluşturun:**
```sql
-- PostgreSQL'e bağlanın
psql -U postgres

-- Database ve user oluşturun
CREATE DATABASE postureguard;
CREATE USER postureguard_user WITH ENCRYPTED PASSWORD 'postureguard_pass';
GRANT ALL PRIVILEGES ON DATABASE postureguard TO postureguard_user;
```

5. **Environment değişkenlerini ayarlayın:**
```bash
export DATABASE_URL="postgresql://postureguard_user:postureguard_pass@localhost:5432/postureguard"
export REDIS_URL="redis://localhost:6379"
# Diğer environment değişkenleri...
```

6. **Database migration:**
```bash
alembic upgrade head
```

#### Frontend Kurulumu

1. **Frontend dizinine gidin:**
```bash
cd frontend
```

2. **Node.js bağımlılıklarını yükleyin:**
```bash
npm install
```

3. **Frontend'i build edin:**
```bash
npm run build
```

## ▶️ Çalıştırma

### Docker ile Çalıştırma
```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Servisleri durdur
docker-compose down
```

### Manuel Çalıştırma

#### Backend'i başlatın:
```bash
# Virtual environment'ı aktifleştirin
source venv/bin/activate  # Linux/Mac
# veya
venv\Scripts\activate     # Windows

# Uvicorn server'ı başlatın
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend'i başlatın (Development):
```bash
cd frontend
npm start
```

### Erişim URL'leri
- **Frontend**: http://localhost:3000 (development) veya http://localhost:80 (production)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc



## 📡 API Endpoints

### Kimlik Doğrulama
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/login` - Kullanıcı girişi
- `GET /auth/google` - Google OAuth redirect
- `GET /auth/google/callback` - Google OAuth callback

### Duruş Analizi
- `POST /analyze/upload` - Fotoğraf upload ve analiz
- `GET /analyze/result/{result_id}` - Analiz sonucu görüntüleme
- `WebSocket /ws/live-analysis` - Gerçek zamanlı analiz

### Raporlar
- `GET /report/{result_id}/pdf` - PDF rapor oluşturma
- `GET /report/{result_id}/data` - Rapor verilerini getirme

### Chatbot
- `POST /chatbot/chat` - AI chatbot ile sohbet
- `GET /chatbot/history` - Sohbet geçmişi

### İletişim
- `POST /contact/send` - İletişim formu gönderimi

## ⚙️ Konfigürasyon

### Google OAuth Ayarları

1. [Google Cloud Console](https://console.cloud.google.com/)'a gidin
2. Yeni proje oluşturun veya mevcut projeyi seçin
3. "APIs & Services" > "Credentials" bölümüne gidin
4. "Create Credentials" > "OAuth 2.0 Client IDs" seçin
5. Application type: "Web application"
6. Authorized JavaScript origins: `http://localhost:3000`
7. Authorized redirect URIs: `http://localhost:8000/auth/google/callback`

### Google Generative AI Ayarları

1. [Google AI Studio](https://makersuite.google.com/app/apikey)'ya gidin
2. API key oluşturun
3. `.env` dosyasına `GOOGLE_API_KEY` olarak ekleyin

### Email Ayarları (İsteğe bağlı)

Gmail App Password oluşturmak için:
1. Google Account Settings > Security
2. 2-Step Verification'ı aktifleştirin
3. App passwords oluşturun
4. Oluşturulan parolayı `SMTP_PASSWORD` olarak kullanın

## 🐛 Sorun Giderme

### Sık Karşılaşılan Sorunlar

#### Database Connection Error
```bash
# PostgreSQL servisinin çalıştığını kontrol edin
sudo systemctl status postgresql

# Connection string'i kontrol edin
echo $DATABASE_URL
```

#### Redis Connection Error
```bash
# Redis servisinin çalıştığını kontrol edin
redis-cli ping

# Redis URL'i kontrol edin
echo $REDIS_URL
```

#### Frontend Build Hatası
```bash
# Node modules'ları temizleyin
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Google OAuth Error
- Client ID ve Secret'ın doğru olduğunu kontrol edin
- Redirect URI'ların Google Console'da tanımlı olduğunu kontrol edin
- CORS ayarlarını kontrol edin

### Log Kontrolleri

#### Docker logları:
```bash
# Tüm servislerin logları
docker-compose logs

# Sadece backend logları
docker-compose logs backend

# Gerçek zamanlı log takibi
docker-compose logs -f backend
```

#### Manuel çalıştırma logları:
```bash
# Backend log level'ını artırın
uvicorn main:app --log-level debug

# Frontend debug modunu aktifleştirin
REACT_APP_DEBUG=true npm start
```

### Performance Optimizasyonu

#### Database Optimizasyonu:
```sql
-- PostgreSQL için index oluşturma
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posture_results_user_id ON posture_results(user_id);
```

#### Redis Cache Ayarları:
```bash
# Redis memory limit ayarlama
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## 🔧 Geliştirme

### Kod Yapısı
```
├── routers/                 # FastAPI route handlers
│   ├── auth.py             # Kimlik doğrulama
│   ├── posture_analyzer.py # Duruş analizi
│   ├── chatbot.py          # AI chatbot
│   └── ...
├── frontend/src/
│   ├── components/         # React bileşenleri
│   ├── services/          # API servisleri
│   └── ...
├── alembic/               # Database migrations
├── models.py              # SQLAlchemy modelleri
├── schemas.py             # Pydantic şemaları
└── main.py               # FastAPI uygulaması
```

### Yeni Migration Oluşturma:
```bash
alembic revision --autogenerate -m "Migration açıklaması"
alembic upgrade head
```

### Test Çalıştırma:
```bash
# Backend testleri
pytest

# Frontend testleri
cd frontend
npm test
```

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim ve Destek

- **GitHub Issues**: [Sorun bildirimi](https://github.com/gulbahar-donmez/Team-116/issues)
- **Email**: [destek.postureguard@gmail.com]

---

## 📞 Destek ve İletişim

- **Ana Proje Repository**: [Team-116](https://github.com/gulbahar-donmez/Team-116)
- **Issues**: [Sorun Bildirimi](https://github.com/gulbahar-donmez/Team-116/issues)
- **Genel Proje Bilgileri**: [Ana README](https://github.com/gulbahar-donmez/Team-116/blob/master/README.md)

---

**⚠️ Not**: Bu uygulama eğitim amaçlı geliştirilmiştir. Sağlık sorunları için mutlaka profesyonel tıbbi yardım alınmalıdır. 
