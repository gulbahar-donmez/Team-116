#!/bin/bash

# PostureGuard Deployment Script for Google Cloud VM
echo "🚀 Starting PostureGuard deployment..."

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
    libgomp1

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/postureguard
sudo chown $USER:$USER /opt/postureguard

# Copy application files (assuming you'll upload them)
echo "📋 Setting up application files..."
# Note: You'll need to upload your project files to this directory

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
sudo -u postgres psql -c "CREATE DATABASE postureguard;"
sudo -u postgres psql -c "CREATE USER postureguard_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE postureguard TO postureguard_user;"

# Setup Redis
echo "🔴 Setting up Redis..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Create .env file
echo "⚙️ Creating environment configuration..."
cat > /opt/postureguard/.env << EOF
DATABASE_URL=postgresql://postureguard_user:your_secure_password@localhost:5432/postureguard
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_secret_key_here
GOOGLE_API_KEY=your_google_api_key_here
EOF

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/postureguard << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static/ {
        alias /opt/postureguard/frontend/build/;
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

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at: http://$(curl -s ifconfig.me)"
echo "📊 Check service status with: sudo systemctl status postureguard"
echo "📝 View logs with: sudo journalctl -u postureguard -f" 