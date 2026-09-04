const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} = require('discord.js');
const { berakApi } = require('../config');

const sessions = new Map();
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function getApiUrl(link) {
  const { baseUrl, apiKey } = berakApi;
  return `${baseUrl}/api/dl/tiktok?apikey=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(link)}`;
}

function getDownloadUrl(links, name) {
  const link = links?.find((item) => item?.name === name && typeof item.url === 'string');
  return link?.url || null;
}

async function downloadFile(url, label) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!response.ok) throw new Error(`Gagal mengambil ${label}: ${response.status}`);

  const contentLength = Number(response.headers.get('content-length'));
  if (contentLength > MAX_UPLOAD_BYTES) {
    throw new Error(`${label} lebih besar dari batas upload Discord (25 MB).`);
  }

  const file = Buffer.from(await response.arrayBuffer());
  if (!file.length) throw new Error(`${label} yang diterima kosong.`);
  if (file.length > MAX_UPLOAD_BYTES) {
    throw new Error(`${label} lebih besar dari batas upload Discord (25 MB).`);
  }
  return file;
}

function createControls(sessionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tiktok_audio:${sessionId}`)
      .setLabel('🎵 Audio')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`tiktok_close:${sessionId}`)
      .setLabel('✖️ Close')
      .setStyle(ButtonStyle.Danger)
  );
}

function createCloseControl(sessionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tiktok_close:${sessionId}`)
      .setLabel('✖️ Close')
      .setStyle(ButtonStyle.Danger)
  );
}

async function fetchTikTok(link) {
  const response = await fetch(getApiUrl(link), {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!response.ok) throw new Error(`API gagal merespons dengan status ${response.status}.`);

  const data = await response.json();
  const links = data?.data?.links;
  const videoUrl = getDownloadUrl(links, 'Video No Watermark') || getDownloadUrl(links, 'Video HD');
  const audioUrl = getDownloadUrl(links, 'Music MP3');
  if (!videoUrl) throw new Error('Respons API tidak mengembalikan video TikTok yang valid.');
  if (!audioUrl) throw new Error('Respons API tidak mengembalikan audio TikTok yang valid.');

  return {
    title: data?.data?.title || 'TikTok video',
    videoUrl,
    audioUrl
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tiktok')
    .setDescription('Download video TikTok dan kirim ke Discord 🎬')
    .addStringOption((option) => option
      .setName('url')
      .setDescription('Link video TikTok 🔗')
      .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const link = interaction.options.getString('url', true).trim();
    if (!/^https?:\/\/(www\.)?tiktok\.com\//i.test(link)) {
      return interaction.editReply('⚠️ Masukkan link TikTok yang valid.');
    }

    try {
      const result = await fetchTikTok(link);
      const video = await downloadFile(result.videoUrl, 'video TikTok');
      const sessionId = interaction.id;
      sessions.set(sessionId, { ...result, userId: interaction.user.id });

      return interaction.editReply({
        content: `🎬 **${result.title}**`,
        files: [{ attachment: video, name: 'tiktok.mp4' }],
        components: [createControls(sessionId)]
      });
    } catch (error) {
      return interaction.editReply(`❌ Gagal download TikTok: ${error.message}`);
    }
  },

  async handleInteraction(interaction) {
    const [action, sessionId] = interaction.customId.split(':');
    const session = sessions.get(sessionId);
    if (!session) {
      return interaction.reply({ content: '⚠️ Sesi TikTok ini sudah tidak tersedia.', ephemeral: true });
    }
    if (session.userId !== interaction.user.id) {
      return interaction.reply({ content: '🔒 Hanya orang yang menjalankan command ini yang bisa memakai tombolnya.', ephemeral: true });
    }

    if (action === 'tiktok_close') {
      sessions.delete(sessionId);
      await interaction.deferUpdate();
      return interaction.message.delete().catch(() => null);
    }

    if (action === 'tiktok_audio') {
      await interaction.deferReply();
      try {
        const audio = await downloadFile(session.audioUrl, 'audio TikTok');
        return interaction.editReply({
          content: `🎵 **Audio: ${session.title}**`,
          files: [{ attachment: audio, name: 'tiktok.mp3' }],
          components: [createCloseControl(sessionId)]
        });
      } catch (error) {
        return interaction.editReply({ content: `❌ Gagal mengambil audio: ${error.message}` });
      }
    }
  }
};