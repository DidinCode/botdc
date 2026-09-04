const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
} = require('discord.js');

function isOwnerOrAdmin(interaction) {
  if (!interaction.guild) return false;
  return interaction.user.id === interaction.guild.ownerId || interaction.member.permissions.has('Administrator');
}

function createVoicePanel() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('pengaturan_voice_rename')
      .setLabel('✏️ Ganti Nama')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('pengaturan_voice_lock')
      .setLabel('🔒 Lock')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('pengaturan_voice_unlock')
      .setLabel('🔓 Unlock')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('pengaturan_voice_visible')
      .setLabel('👁️ Visible')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('pengaturan_voice_invisible')
      .setLabel('🙈 Invisible')
      .setStyle(ButtonStyle.Danger)
  );
}

function createChatPanel() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('pengaturan_chat_lock')
      .setLabel('🔒 Tutup Chat')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('pengaturan_chat_unlock')
      .setLabel('🔓 Buka Chat')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('pengaturan_chat_private')
      .setLabel('🙈 Privasi Chat Tertutup')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('pengaturan_chat_public')
      .setLabel('🌐 Privasi Chat Umum')
      .setStyle(ButtonStyle.Secondary)
  );
}

async function applyEveryonePermission(channel, permission, value) {
  if (!channel || !channel.guild) return;
  const everyoneRole = channel.guild.roles.everyone;
  await channel.permissionOverwrites.edit(everyoneRole, { [permission]: value });
}

async function handleVoiceAction(interaction) {
  const targetChannel = interaction.member?.voice?.channel || interaction.channel;

  if (!targetChannel || targetChannel.type !== 2) {
    return interaction.reply({
      content: '🔊 Kamu harus masuk ke voice channel sebelum memakai pengaturan voice.',
      ephemeral: true
    });
  }

  const customId = interaction.customId;

  if (customId === 'pengaturan_voice_lock') {
    await applyEveryonePermission(targetChannel, 'Connect', false);
    return interaction.reply({ content: `🔒 Voice <#${targetChannel.id}> sudah di-lock. Member lain tidak bisa join.`, ephemeral: true });
  }

  if (customId === 'pengaturan_voice_unlock') {
    await applyEveryonePermission(targetChannel, 'Connect', true);
    return interaction.reply({ content: `🔓 Voice <#${targetChannel.id}> sudah di-unlock.`, ephemeral: true });
  }

  if (customId === 'pengaturan_voice_visible') {
    await applyEveryonePermission(targetChannel, 'ViewChannel', true);
    return interaction.reply({ content: `👁️ Voice <#${targetChannel.id}> sekarang visible.`, ephemeral: true });
  }

  if (customId === 'pengaturan_voice_invisible') {
    await applyEveryonePermission(targetChannel, 'ViewChannel', false);
    return interaction.reply({ content: `🙈 Voice <#${targetChannel.id}> sekarang invisible.`, ephemeral: true });
  }

  if (customId === 'pengaturan_voice_rename') {
    const modal = new ModalBuilder()
      .setCustomId('pengaturan_voice_rename_modal')
      .setTitle('✏️ Ganti Nama Voice');

    const nameInput = new TextInputBuilder()
      .setCustomId('voice_new_name')
      .setLabel('📝 Nama Baru Voice')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Masukkan nama baru ✍️');

    modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
    return interaction.showModal(modal);
  }
}

async function handleChatAction(interaction) {
  if (!isOwnerOrAdmin(interaction)) {
    return interaction.reply({
      content: '🔒 Hanya owner server atau admin yang bisa mengatur privasi chat.',
      ephemeral: true
    });
  }

  const targetChannel = interaction.channel;
  if (!targetChannel || targetChannel.isDMBased || targetChannel.type === 2) {
    return interaction.reply({ content: '🚫 Command ini hanya bisa dipakai di text channel server.', ephemeral: true });
  }

  const customId = interaction.customId;

  if (customId === 'pengaturan_chat_lock') {
    await applyEveryonePermission(targetChannel, 'SendMessages', false);
    return interaction.reply({ content: `🔒 Chat <#${targetChannel.id}> sudah ditutup.`, ephemeral: true });
  }

  if (customId === 'pengaturan_chat_unlock') {
    await applyEveryonePermission(targetChannel, 'SendMessages', true);
    return interaction.reply({ content: `🔓 Chat <#${targetChannel.id}> sudah dibuka kembali.`, ephemeral: true });
  }

  if (customId === 'pengaturan_chat_private') {
    await applyEveryonePermission(targetChannel, 'ViewChannel', false);
    return interaction.reply({ content: `🙈 Chat <#${targetChannel.id}> sekarang privasi tertutup.`, ephemeral: true });
  }

  if (customId === 'pengaturan_chat_public') {
    await applyEveryonePermission(targetChannel, 'ViewChannel', true);
    return interaction.reply({ content: `🌐 Chat <#${targetChannel.id}> sekarang privasi umum.`, ephemeral: true });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pengaturan')
    .setDescription('Buka panel pengaturan server untuk owner/admin ⚙️'),

  async execute(interaction) {
    const memberVoice = interaction.member?.voice?.channel;

    if (memberVoice) {
      return interaction.reply({
        content: '🔊 Pilih pengaturan voice untuk channel yang kamu masuki sekarang.',
        components: [createVoicePanel()],
        ephemeral: true
      });
    }

    if (interaction.channel && !interaction.channel.isDMBased && interaction.channel.type !== 2) {
      if (!isOwnerOrAdmin(interaction)) {
        return interaction.reply({
          content: '🔒 Hanya owner server atau admin yang bisa mengatur privasi chat.',
          ephemeral: true
        });
      }

      return interaction.reply({
        content: '💬 Pilih pengaturan chat untuk channel ini.',
        components: [createChatPanel()],
        ephemeral: true
      });
    }

    return interaction.reply({
      content: '🔊 Masuk ke voice channel untuk pengaturan voice, atau pakai perintah di text channel untuk pengaturan chat.',
      ephemeral: true
    });
  },

  async handleInteraction(interaction) {
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('pengaturan_voice_')) {
        await handleVoiceAction(interaction);
        return;
      }

      if (interaction.customId.startsWith('pengaturan_chat_')) {
        await handleChatAction(interaction);
        return;
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'pengaturan_voice_rename_modal') {
      const newName = interaction.fields.getTextInputValue('voice_new_name');
      const targetChannel = interaction.member?.voice?.channel || interaction.channel;

      if (!targetChannel || targetChannel.type !== 2) {
        return interaction.reply({
          content: '🔊 Kamu harus berada di voice channel untuk mengganti nama.',
          ephemeral: true
        });
      }

      await targetChannel.setName(newName.trim().slice(0, 100));
      return interaction.reply({
        content: `✏️ Nama voice berhasil diubah menjadi **${newName.trim().slice(0, 100)}**.`,
        ephemeral: true
      });
    }
  }
};
