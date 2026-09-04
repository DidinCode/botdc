const { SlashCommandBuilder } = require('discord.js');
const { musicApi } = require('../config');

function getApiUrl(text) {
  const { baseUrl, apiKey } = musicApi;
  return `${baseUrl}/iqc?api=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(text)}`;
}

async function fetchIphoneImage(text) {
  const response = await fetch(getApiUrl(text), {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  if (!response.ok) {
    throw new Error(`API gagal merespons dengan status ${response.status}.`);
  }

  const data = await response.json();
  const imageUrl = data?.result?.image;
  if (typeof imageUrl !== 'string' || !/^https?:\/\//i.test(imageUrl)) {
    throw new Error('Respons API tidak mengembalikan gambar yang valid.');
  }

  const imageResponse = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!imageResponse.ok) {
    throw new Error(`Gagal mengambil gambar hasil API: ${imageResponse.status}`);
  }

  return Buffer.from(await imageResponse.arrayBuffer());
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('iphone')
    .setDescription('Buat gambar chat iPhone dari teks 📱')
    .addStringOption((option) => option
      .setName('text')
      .setDescription('Teks yang ingin ditampilkan di gambar ✍️')
      .setMaxLength(1000)
      .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const text = interaction.options.getString('text', true).trim();
    if (!text) return interaction.editReply('⚠️ Teks tidak boleh kosong.');

    try {
      const image = await fetchIphoneImage(text);
      return interaction.editReply({
        content: '📱 Gambar iPhone berhasil dibuat.',
        files: [{ attachment: image, name: 'iphone.png' }]
      });
    } catch (error) {
      return interaction.editReply(`❌ Gagal membuat gambar iPhone: ${error.message}`);
    }
  }
};