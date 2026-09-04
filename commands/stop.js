const { SlashCommandBuilder } = require('discord.js');
const playCommand = require('./play');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop lagu yang lagi diputar dan keluar dari voice channel ⏹️'),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply('🚫 Command !stop hanya bisa dipakai di server Discord.');
    }

    const guildId = interaction.guild.id;
    const stopped = playCommand.stopGuildAudio(guildId);

    if (!stopped) {
      return interaction.reply({
        content: '🔇 Tidak ada lagu yang sedang diputar di server ini.',
        ephemeral: true
      });
    }

    return interaction.reply({
      content: '⏹️ Musik dihentikan dan bot keluar dari voice channel.',
      ephemeral: false
    });
  }
};
