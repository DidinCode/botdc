const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pp')
    .setDescription('Lihat foto profil user 🖼️')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Pilih user yang ingin dilihat avatar-nya 👤')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const avatar = user.displayAvatarURL({ dynamic: true, size: 2048 });

    await interaction.deferReply();
    await interaction.editReply({
      content: `🖼️ Foto profil ${user.tag}`,
      files: [{ attachment: avatar }]
    });
  }
};
