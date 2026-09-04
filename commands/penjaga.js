const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('penjaga')
    .setDescription('Masuk ke voice channel dan tinggal di sana selagi bot masih aktif 🎧'),

  async execute(interaction) {
    const memberVoice = interaction.member?.voice?.channel;

    if (!memberVoice) {
      return interaction.reply({
        content: '⚠️ Bot nggak bisa masuk voice. Kamu harus berada di voice channel dulu sebelum pakai command ini.',
        ephemeral: true
      });
    }

    const guildId = interaction.guild.id;
    const existingConnection = getVoiceConnection(guildId);
    const activeChannelId = existingConnection?.joinConfig?.channelId;

    if (activeChannelId === memberVoice.id) {
      existingConnection.destroy();
      return interaction.reply({
        content: '👋 Bot sudah keluar dari voice channel.',
        ephemeral: false
      });
    }

    if (existingConnection && activeChannelId) {
      return interaction.reply({
        content: `⚠️ Bot sedang menjaga channel lain: <#${activeChannelId}>. Bot hanya bisa menjaga satu voice channel per server. Keluar dulu sebelum pindah channel.`,
        ephemeral: true
      });
    }

    const connection = joinVoiceChannel({
      channelId: memberVoice.id,
      guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });

    if (!connection) {
      return interaction.reply({
        content: '⚠️ Bot belum bisa masuk voice sekarang. Coba lagi sebentar.',
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `🎧 Bot masuk ke <#${memberVoice.id}> dan akan tetap berada di voice ini selama bot aktif.`,
      ephemeral: false
    });
  }
};
