# Circle Management Bot

Bot Telegram untuk mengelola Circle Management API dengan interface button yang clean dan user-friendly.

## 🚀 Fitur

- ✅ **Validasi Nomor** - Validasi nomor anggota sebelum diundang
- 🆕 **Buat Circle** - Membuat grup circle baru dengan anggota pertama
- 👥 **Undang Anggota** - Mengundang anggota baru ke circle yang sudah ada
- 📊 **Info Circle** - Melihat informasi detail circle dan kuota
- 🎁 **Kelola Bonus** - Mengklaim bonus yang tersedia
- 👤 **Kelola Anggota** - Mengeluarkan anggota dari circle

## 🎯 Interface

Bot menggunakan **inline keyboard buttons** untuk navigasi yang mudah:
- 🎨 **Clean Interface** - Pesan lama otomatis terhapus saat klik button
- ⚡ **Smooth Navigation** - Transisi yang seamless antar menu
- 📱 **Mobile Friendly** - Interface yang touch-friendly
- 🔄 **Message Replacement** - Tidak ada duplikasi pesan

## 🛠️ Instalasi

### Prasyarat
- Node.js 16+ 
- Bot Token dari @BotFather
- API Key dari hidepulsa.com

### Langkah Instalasi

1. **Clone dan install**
   ```bash
   git clone https://github.com/AutoFTbot/BotManageCircel
   cd BotManageCircel
   npm install
   ```

2. **Setup environment**
   ```bash
   cp env.example .env
   # Edit .env dengan token dan API key Anda
   ```

3. **Jalankan bot**
   ```bash
   npm run dev    # Development
   npm start      # Production
   ```

## 🚀 GitHub Actions

Bot ini sudah dikonfigurasi dengan GitHub Actions untuk:
- ✅ **Auto Build** - Build otomatis saat push ke main branch
- ✅ **Testing** - Run tests pada multiple Node.js versions
- ✅ **Linting** - Code quality checks
- ✅ **Deployment Package** - Generate deployment artifact

## 🐳 Docker Deployment

### Docker Compose (Recommended)
```bash
# Setup environment
cp env.example .env
# Edit .env dengan konfigurasi Anda

# Run with Docker Compose
docker-compose up -d
```

### Manual Docker
```bash
# Build image
docker build -t botcircle .

# Run container
docker run -d --name botcircle \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  botcircle
```

## 📁 Struktur Project

```
BOTCIRCLE/
├── src/
│   ├── handlers/          # Button handlers
│   ├── services/          # API services
│   ├── utils/            # Utilities
│   └── index.js          # Main bot file
├── logs/                 # Log files
└── package.json
```

## 🔧 Konfigurasi

Edit file `.env`:
```env
BOT_TOKEN=your_telegram_bot_token
API_KEY=your_api_key
DEFAULT_ID_TELEGRAM=your_ID_Telegram
DEFAULT_PASSWORD=your_Password
```

## 📞 Support

- Cek logs di folder `logs/`
- Buat issue di repository

---

**Dibuat dengan ❤️ untuk kemudahan pengelolaan Circle**
