const { SlashCommandBuilder } = require('discord.js');
const { berakApi } = require('../config');

function getApiUrl(text) {
  return `${berakApi.baseUrl}/api/maker/windows?apikey=${encodeURIComponent(berakApi.apiKey)}&text=${encodeURIComponent(text)}`;
}

async function getImageBuffer(text) {
  const response = await fetch(getApiUrl(text), {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  if (!response.ok) {
    throw new Error(`API gagal merespons dengan status ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.startsWith('image/')) {
    return Buffer.from(await response.arrayBuffer());
  }

  const data = await response.json();
  const imageUrl = data?.result?.image || data?.result?.url || data?.image || data?.url;
  if (typeof imageUrl !== 'string' || !/^https?:\/\//i.test(imageUrl)) {
    throw new Error('Respons API tidak mengembalikan gambar yang valid.');
  }

  const imageResponse = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!imageResponse.ok) {
    throw new Error(`Gagal mengambil gambar hasil API: ${imageResponse.status}.`);
  }

  return Buffer.from(await imageResponse.arrayBuffer());
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('windows')
    .setDescription('Buat gambar Windows dari teks 🪟')
    .addStringOption((option) => option
      .setName('text')
      .setDescription('Teks yang ingin ditampilkan ✍️')
      .setMaxLength(1000)
      .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const text = interaction.options.getString('text', true).trim();
    if (!text) return interaction.editReply('⚠️ Teks tidak boleh kosong.');

    try {
      const image = await getImageBuffer(text);
      return interaction.editReply({
        content: '🪟 Gambar Windows berhasil dibuat.',
        files: [{ attachment: image, name: 'windows.png' }]
      });
    } catch (error) {
      return interaction.editReply(`❌ Gagal membuat gambar Windows: ${error.message}`);
    }
  }
};