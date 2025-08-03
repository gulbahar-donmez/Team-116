#!/bin/bash

# PostureGuard Production Deployment Script for Google Cloud VM
echo "🚀 Starting PostureGuard production deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required system dependencies
echo "🔧 Installing system dependencies..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    postgresql \
    postgresql-contrib \
    redis-server \
    nginx \
    git \
    curl \
    wget \
    unzip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    nodejs \
    npm

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/postureguard
sudo chown $USER:$USER /opt/postureguard

# Create Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd /opt/postureguard
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Setup PostgreSQL
echo "🗄️ Setting up PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE postureguard;" || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER postureguard_user WITH PASSWORD 'postureguard_pass';" || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE postureguard TO postureguard_user;"

# Setup Redis
echo "🔴 Setting up Redis..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Create .env file for production
echo "⚙️ Creating production environment configuration..."
cat > /opt/postureguard/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://postureguard_user:postureguard_pass@localhost:5432/postureguard

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Google API Configuration
GOOGLE_API_KEY=your_google_api_key_here

# Application Settings
DEBUG=False
ENVIRONMENT=production
ALLOWED_HOSTS=34.173.46.223,localhost,127.0.0.1

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000,http://localhost:8080,http://localhost:3001,http://34.173.46.223,http://34.173.46.223:80,http://34.173.46.223:8000,https://34.173.46.223
EOF

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/postureguard << EOF
server {
    listen 80;
    server_name 34.173.46.223;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket proxy
    location /live_posture_ai/ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Frontend static files
    location / {
        root /opt/postureguard/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Static files
    location /static/ {
        alias /opt/postureguard/frontend/build/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/postureguard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# Create systemd service for the application
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/postureguard.service << EOF
[Unit]
Description=PostureGuard FastAPI Application
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/postureguard
Environment=PATH=/opt/postureguard/venv/bin
ExecStart=/opt/postureguard/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
echo "🚀 Starting PostureGuard service..."
sudo systemctl daemon-reload
sudo systemctl enable postureguard
sudo systemctl start postureguard

# Run database migrations
echo "🗄️ Running database migrations..."
cd /opt/postureguard
source venv/bin/activate
alembic upgrade head

# Build frontend for production
echo "🏗️ Building frontend for production..."
cd /opt/postureguard/frontend

# Create production environment file
cat > .env.production << EOF
REACT_APP_API_URL=http://34.173.46.223:8000
REACT_APP_WEBSOCKET_URL=ws://34.173.46.223:8000
EOF

npm ci  # Use package-lock.json for consistent install
npm run build

echo "✅ Production deployment completed!"
echo "🌐 Your application should be available at: http://34.173.46.223"
echo "📊 Check service status with: sudo systemctl status postureguard"
echo "📝 View logs with: sudo journalctl -u postureguard -f"
echo ""
echo "⚠️  IMPORTANT: Update your .env file with:"
echo "- GOOGLE_API_KEY: Your Google AI API key"
echo "- SECRET_KEY: Already generated"
echo "- Database password: postureguard_pass" 