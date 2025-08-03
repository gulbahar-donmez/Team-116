# 🚀 PostureGuard Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
- [ ] `SECRET_KEY` güvenli bir değerle güncellendi
- [ ] `GOOGLE_API_KEY` eklendi
- [ ] `DATABASE_URL` doğru yapılandırıldı
- [ ] `DEBUG=False` olarak ayarlandı
- [ ] `ENVIRONMENT=production` olarak ayarlandı

### 2. Security
- [ ] Database şifresi güçlü bir şifre ile değiştirildi
- [ ] SSH anahtarları güvenli
- [ ] Firewall ayarları kontrol edildi (HTTP/HTTPS açık)
- [ ] Production'da debug modu kapalı

### 3. Database
- [ ] PostgreSQL kuruldu ve çalışıyor
- [ ] Database ve kullanıcı oluşturuldu
- [ ] Alembic migration'ları çalıştırıldı
- [ ] Database bağlantısı test edildi

### 4. Frontend
- [ ] `REACT_APP_API_URL=http://34.173.46.223:8000` ayarlandı
- [ ] Production build oluşturuldu
- [ ] Static dosyalar Nginx'e kopyalandı

### 5. Backend
- [ ] CORS ayarları production IP'leri içeriyor
- [ ] Tüm hardcoded localhost URL'leri düzeltildi
- [ ] Environment variables doğru yükleniyor
- [ ] API endpoints test edildi

## 🔧 Deployment Steps

### 1. VM'e Bağlan
```bash
ssh gulbahardonmez_dev@34.173.46.223
```

### 2. Proje Dosyalarını Yükle
```bash
# Git ile
sudo apt-get install -y git
git clone <your-repo-url> /opt/postureguard

# VEYA SCP ile
scp -r ./Posture_Guard_v8/* gulbahardonmez_dev@34.173.46.223:/opt/postureguard/
```

### 3. Production Deployment Script'ini Çalıştır
```bash
cd /opt/postureguard
chmod +x deploy_production.sh
./deploy_production.sh
```

### 4. Environment Variables'ları Güncelle
```bash
nano /opt/postureguard/.env
```

Aşağıdaki değerleri güncelle:
- `GOOGLE_API_KEY`: Google AI API anahtarınız
- `SECRET_KEY`: Zaten otomatik oluşturuldu
- `DATABASE_URL`: Zaten ayarlandı

### 5. Servisleri Test Et
```bash
# Backend servisi
sudo systemctl status postureguard

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis-server
```

### 6. API'yi Test Et
```bash
# API endpoint'lerini test et
curl http://34.173.46.223:8000/
curl http://34.173.46.223:8000/docs

# WebSocket bağlantısını test et
wscat -c ws://34.173.46.223:8000/live_posture_ai/ws
```

## 🌐 Production URLs

- **Frontend**: http://34.173.46.223
- **API**: http://34.173.46.223:8000
- **API Docs**: http://34.173.46.223:8000/docs
- **WebSocket**: ws://34.173.46.223:8000/live_posture_ai/ws

## 📊 Monitoring

### Logları İzle
```bash
# Uygulama logları
sudo journalctl -u postureguard -f

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logları
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Sistem Kaynakları
```bash
# CPU ve Memory kullanımı
htop

# Disk kullanımı
df -h

# Network bağlantıları
sudo netstat -tlnp
```

## 🚨 Troubleshooting

### Servis Başlatılamıyorsa
```bash
# Logları kontrol et
sudo journalctl -u postureguard -n 50

# Manuel test
cd /opt/postureguard
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Database Bağlantı Sorunu
```bash
# PostgreSQL durumu
sudo systemctl status postgresql

# Database bağlantısını test et
psql -h localhost -U postureguard_user -d postureguard
```

### Frontend Yüklenmiyorsa
```bash
# Nginx durumu
sudo systemctl status nginx

# Frontend build dosyalarını kontrol et
ls -la /opt/postureguard/frontend/build/

# Nginx config'ini test et
sudo nginx -t
```

## 🔄 Güncelleme

### Yeni Kod Yükleme
```bash
# Yeni kodları yükle
cd /opt/postureguard
git pull

# Frontend'i yeniden build et
cd frontend
npm run build

# Backend servisini yeniden başlat
sudo systemctl restart postureguard

# Database migration'ları çalıştır
source venv/bin/activate
alembic upgrade head
```

## ⚠️ Önemli Notlar

1. **e2-micro instance** sınırlı kaynaklara sahip
2. **Google API Key** mutlaka eklenmeli
3. **SECRET_KEY** otomatik oluşturuldu, değiştirmeyin
4. **Database şifresi**: `postureguard_pass`
5. **Firewall**: HTTP (80) ve HTTPS (443) açık
6. **Monitoring**: Düzenli olarak logları kontrol edin 