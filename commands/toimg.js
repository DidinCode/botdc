const { SlashCommandBuilder, MessageFlags } = require('discord.js');

async function findRecentImageMessage(channel, userId) {
  if (!channel) return null;

  const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (!messages) return null;

  for (const message of messages.values()) {
    if (message.author.bot) continue;
    if (userId && message.author.id !== userId) continue;

    const sticker = message.stickers?.first();
    if (sticker) return { message, url: sticker.url };

    const attachment = message.attachments?.first();
    if (attachment && attachment.contentType?.startsWith('image/')) return { message, url: attachment.url };

    const embedImage = message.embeds?.find((embed) => embed.image?.url || embed.thumbnail?.url);
    if (embedImage) {
      return { message, url: embedImage.image?.url || embedImage.thumbnail?.url };
    }
  }

  return null;
}

async function resolveImageUrl(interaction) {
  const explicitLink = interaction.options.getString('link');
  const explicitFile = interaction.options.getAttachment('file');

  if (explicitLink) return explicitLink;
  if (explicitFile) return explicitFile.url;

  const replyMessageId = interaction.reference?.messageId;
  if (replyMessageId && interaction.channel) {
    const repliedMessage = await interaction.channel.messages.fetch(replyMessageId).catch(() => null);
    if (repliedMessage) {
      const sticker = repliedMessage.stickers?.first();
      if (sticker) return sticker.url;

      const attachment = repliedMessage.attachments?.first();
      if (attachment) return attachment.url;

      const embedImage = repliedMessage.embeds?.find((embed) => embed.image?.url || embed.thumbnail?.url);
      if (embedImage) return embedImage.image?.url || embedImage.thumbnail?.url;
    }
  }

  const recentMatch = await findRecentImageMessage(interaction.channel, interaction.user.id);
  if (recentMatch) return recentMatch.url;

  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toimg')
    .setDescription('Ambil sticker atau file dan kirim ulang sebagai gambar 🖼️')
    .addStringOption((option) =>
      option
        .setName('link')
        .setDescription('Tautan sticker atau gambar (opsional) 🔗')
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName('file')
        .setDescription('File gambar / sticker (opsional) 📎')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const imageUrl = await resolveImageUrl(interaction);

    if (!imageUrl) {
      return interaction.editReply({
        content: '⚠️ Aku tidak menemukan sticker atau gambar dari reply/file yang kamu kirim. Coba pakai opsi `link` atau `file`, atau reply pesan yang memang berisi sticker/gambar.'
      });
    }

    await interaction.editReply({
      content: '🖼️ Berikut hasilnya:',
      files: [{
        attachment: imageUrl,
        name: 'result.png'
      }]
    });
  }
};
