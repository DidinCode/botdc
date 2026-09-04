const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick user dari server 👢')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('User yang akan di-kick 👤')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('alasan')
        .setDescription('Alasan kick 📝')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const alasan = interaction.options.getString('alasan') || 'Tidak ada alasan';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      return interaction.reply({ content: '⚠️ User tidak ada di server ini.', flags: MessageFlags.Ephemeral });
    }

    if (member.id === interaction.guild.ownerId) {
      return interaction.reply({ content: '🚫 Tidak bisa kick owner server.', flags: MessageFlags.Ephemeral });
    }

    try {
      await member.kick(alasan);
      await interaction.reply(`👢 ${user.tag} berhasil di-kick. Alasan: **${alasan}**`);
    } catch (error) {
      await interaction.reply({ content: '🚫 Bot tidak punya izin untuk kick user ini.', flags: MessageFlags.Ephemeral });
    }
  }
};
