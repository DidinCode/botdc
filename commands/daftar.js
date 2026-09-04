const { ownerId } = require('../config');
const { registerUser } = require('../lib/userStore');

module.exports = {
  data: {
    name: 'daftar',
    description: 'Daftar agar bisa memakai command bot 📝'
  },

  async execute(interaction) {
    const result = registerUser(interaction.user);
    if (!result.created) {
      return interaction.reply(`👤 Kamu sudah terdaftar. Limit hari ini: **${result.user.limit}**.`);
    }

    const location = interaction.guild ? `server **${interaction.guild.name}**` : 'DM';
    await interaction.reply('🎉 Pendaftaran berhasil. Kamu mendapat **50 limit per hari**. Limit reset otomatis setiap hari.');

    const owner = await interaction.client.users.fetch(ownerId).catch(() => null);
    if (owner) {
      await owner.send(
        `Pendaftaran baru dari ${interaction.user.tag} (${interaction.user.id}) di ${location}.`
      ).catch((error) => console.error('Gagal mengirim notifikasi pendaftaran:', error.message));
    }
  }
};
