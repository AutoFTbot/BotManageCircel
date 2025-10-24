# Deployment Guide

## 🚀 Quick Deploy

### 1. GitHub Actions (Recommended)
- Push ke `main` branch untuk auto build
- Download artifact dari Actions tab
- Extract dan deploy ke server

### 2. Docker Deploy
```bash
# Clone repository
git clone <your-repo-url>
cd BOTCIRCLE

# Setup environment
cp env.example .env
# Edit .env dengan konfigurasi Anda

# Deploy with Docker Compose
docker-compose up -d
```

### 3. PM2 Deploy
```bash
# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env

# Start with PM2
npm run pm2:start
```

## 🔧 Server Requirements
- Node.js 16+ atau Docker
- 512MB RAM minimum
- 1GB disk space
- Internet connection

## 📝 Environment Variables
```env
BOT_TOKEN=your_telegram_bot_token
API_KEY=your_api_key
LOG_LEVEL=info
```

## 🔍 Monitoring
- Check logs: `docker logs botcircle-management`
- PM2 status: `pm2 status`
- Health check: Bot responds to `/start` command
