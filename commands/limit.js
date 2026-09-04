const { ownerId } = require('../config');
const { addLimit } = require('../lib/userStore');

module.exports = {
  data: {
    name: 'limit',
    description: 'Tambah limit user (owner bot saja) 💳',
    options: [{ name: 'args', description: 'User dan jumlah limit.', required: false }]
  },

  async execute(interaction) {
    if (interaction.user.id !== ownerId) return interaction.reply('🔒 Command ini hanya bisa dipakai owner bot.');
    const raw = interaction.options.getString('args')?.trim() || '';
    const parts = raw.split(/\s+/);
    const targetText = parts.slice(0, -1).join(' ');
    const amountText = parts.at(-1);
    const amount = Number.parseInt(amountText, 10);
    const targetId = targetText.match(/^<@!?([0-9]+)>$/)?.[1] || targetText;
    const target = interaction.message?.mentions?.users?.first()
      || await interaction.client.users.fetch(targetId).catch(() => null)
      || interaction.client.users.cache.find((user) =>
        user.id === targetId
        || user.username.toLowerCase() === targetText.toLowerCase()
        || user.tag.toLowerCase() === targetText.toLowerCase()
      );

    if (!target || !Number.isInteger(amount) || amount < 1) {
      return interaction.reply('📌 Format: `!limit @user jumlah` atau `!limit username jumlah` (contoh: `!limit didincode 500000`).');
    }
    const user = addLimit(target.id, amount);
    if (!user) return interaction.reply('⚠️ User belum terdaftar.');
    return interaction.reply(`💳 Limit ${target} ditambah **${amount}**. Total limit: **${user.limit}**.`);
  }
};
