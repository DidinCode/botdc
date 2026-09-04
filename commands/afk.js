const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Tandai kamu sedang AFK 😴')
    .addStringOption((option) =>
      option
        .setName('alasan')
        .setDescription('Alasan kamu AFK 💤')
        .setRequired(false)
        .setMaxLength(200)
    ),

  async execute(interaction) {
    const reason = interaction.options.getString('alasan') || 'Tidak ada alasan';
    const userId = interaction.user.id;

    global.afkUsers = global.afkUsers || new Map();
    global.afkUsers.set(userId, {
      startedAt: Date.now(),
      reason,
      userName: interaction.user.tag
    });

    await interaction.reply(
      `😴 ${interaction.user} sekarang AFK dengan alasan: **${reason}**. Saat kamu mengirim chat lagi, aku akan menandai kamu sudah kembali 👋`
    );
  }
};
