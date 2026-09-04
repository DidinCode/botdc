require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN || 'MTU0NDM0NjA1MjUxNjEyNjc0MA.GXLrFN.R7FHNIzptZpzQA6JnHVy3BHfeODJDftKd8S5cM',
  clientId: process.env.DISCORD_CLIENT_ID || '1544346052516126740',
  ownerId: process.env.BOT_OWNER_ID || '1475873056613204179',
  guildId: process.env.DISCORD_GUILD_ID || null,
  prefix: process.env.BOT_PREFIX || '!',
  botVersion: process.env.BOT_VERSION || '1.0',
  menuThumbnail: process.env.MENU_THUMBNAIL_URL || 'https://i.ibb.co.com/jZg3Jg9f/Chat-GPT-Image-3-Sep-2026-17-44-43.jpg',
  menuThumbnail2: process.env.MENU_THUMBNAIL2_URL || 'https://i.ibb.co.com/qFNnKrq0/Chat-GPT-Image-3-Sep-2026-01-30-54.png',
  musicApi: {
    baseUrl: process.env.FUKU_API_BASE_URL || 'https://fuku.eu.cc/api',
    apiKey: process.env.FUKU_API_KEY || 'fukuxyz_403cdb'
  },
  berakApi: {
    baseUrl: process.env.BERAK_API || 'https://api.beraknew.web.id',
    apiKey: process.env.BERAK_API_KEY || 'berak_7befb8e5873546c29b8653359eb36ebf'
  }
};
