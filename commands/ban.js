const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban user dari server untuk beberapa hari 🔨')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('User yang akan di-ban 👤')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('hari')
        .setDescription('Berapa hari ban ⏳')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(365)
    )
    .addStringOption((option) =>
      option
        .setName('alasan')
        .setDescription('Alasan ban 📝')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const hari = interaction.options.getInteger('hari');
    const alasan = interaction.options.getString('alasan') || 'Tidak ada alasan';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) {
      return interaction.reply({ content: '⚠️ User tidak ada di server ini.', flags: MessageFlags.Ephemeral });
    }

    if (member.id === interaction.guild.ownerId) {
      return interaction.reply({ content: '🚫 Tidak bisa ban owner server.', flags: MessageFlags.Ephemeral });
    }

    try {
      const until = new Date(Date.now() + hari * 24 * 60 * 60 * 1000);
      await interaction.guild.members.ban(user, { reason: `${alasan} | Banned selama ${hari} hari` });
      await interaction.reply(`🔨 ${user.tag} berhasil di-ban selama **${hari} hari**. Alasan: **${alasan}**`);
      console.log(`Ban user ${user.tag} sampai ${until.toISOString()}`);
    } catch (error) {
      await interaction.reply({ content: '🚫 Bot tidak punya izin untuk ban user ini.', flags: MessageFlags.Ephemeral });
    }
  }
};
