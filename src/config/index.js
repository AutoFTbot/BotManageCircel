require('dotenv').config();

const config = {
  bot: {
    token: process.env.BOT_TOKEN,
  },
  api: {
    baseUrl: process.env.API_BASE_URL,
    apiKey: process.env.API_KEY,
    defaultIdTelegram: process.env.DEFAULT_ID_TELEGRAM,
    defaultPassword: process.env.DEFAULT_PASSWORD,
  },
  logging: {
    level: process.env.LOG_LEVEL,
  },
};

// Validation
if (!config.bot.token) {
  throw new Error('BOT_TOKEN téh kudu di-setup heula');
}

if (!config.api.apiKey) {
  throw new Error('API_KEY ogé wajib di-setup heula');
}

module.exports = config;
