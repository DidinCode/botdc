const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const {
  prefix,
  botVersion,
  menuThumbnail,
  menuThumbnail2
} = require('../config');

let commands = new Map();
let commandGuard = async () => true;
const modalValues = new Map();

function setCommands(commandMap) {
  commands = commandMap;
}

function setCommandGuard(guard) {
  commandGuard = guard;
}

function getCommandOptions(command) {
  return command?.data?.toJSON
    ? command.data.toJSON().options || []
    : command?.data?.options || [];
}

function getCommandUsage(command) {
  const options = getCommandOptions(command);
  const argumentsText = options
    .map((option) => option.required ? `<${option.name}>` : `[${option.name}]`)
    .join(' ');

  return `${prefix}${command.data.name}${argumentsText ? ` ${argumentsText}` : ''}`;
}

/* =========================================================
   BUTTON MENU UTAMA
========================================================= */

function createMainButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_commands')
      // Menggunakan karakter \u2800 untuk memaksa tombol meregang ke samping
.setLabel('\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800𝗟𝗜𝗦𝗧 𝗠𝗘𝗡𝗨\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800')
.setStyle(ButtonStyle.Primary)
  );
}

/* =========================================================
   SELECT MENU COMMAND
========================================================= */

function createCommandSelect() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('menu_command_select')
      .setPlaceholder('📋 Pilih command')
      .addOptions(
        [...commands.entries()].map(([name, command]) => ({
          label: `${prefix}${name}`,
          value: name,
          description: command.data.description
            .slice(0, 100)
        }))
      )
  );
}

/* =========================================================
   CREATE MENU MESSAGE
========================================================= */

function createMenuMessage(client, guild, user, member) {
  const uptime = client.uptime || 0;

  const totalSeconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const device =
    Object.keys(
      member?.presence?.clientStatus || {}
    ).join(', ') || 'Discord';

  const embed = new EmbedBuilder()
    .setColor(0x16c784)
    .setThumbnail(menuThumbnail)
    .setTitle('📋 MENU - LOLI CHAN - MD »')
    .setDescription(
      `**👤 [ INFORMASI USER ]**\n` +
      `🏷️ Nama: ${user}\n` +
      `🆔 Nomor User: \`${user.id}\`\n\n` +

      `**🤖 [ INFORMASI BOT ]**\n` +
      `🏷️ Botname: **${client.user?.username || 'Bot'}**\n` +
      `🌐 Mode: PUBLIC\n` +
      `⚡ Speed: **${client.ws.ping}ms**\n` +
      `⏱️ Runtime: **${minutes} menit ${seconds} detik**\n` +
      `📱 Device: ${device}\n` +
      `📦 Versi: **${botVersion}**\n\n` +

      `👇 Pilih **Menu** yang sudah disediakan.....`
    )
    .setImage(menuThumbnail2)
    .setFooter({
      text: guild ? guild.name : 'Discord Bot'
    });

  return {
    embeds: [embed],
    components: [createMainButtons()]
  };
}

/* =========================================================
   EXPORT
========================================================= */

function createInputModal(command, page = 0, sessionId) {
  const options = getCommandOptions(command);
  const modal = new ModalBuilder()
    .setCustomId(`menu_input:${command.data.name}:${page}:${sessionId}`)
    .setTitle(`Jalankan ${prefix}${command.data.name}`);

  options.slice(page * 5, page * 5 + 5).forEach((option) => {
    const input = new TextInputBuilder()
      .setCustomId(`menu_option:${option.name}`)
      .setLabel(option.name.slice(0, 45))
      .setPlaceholder((option.description || `Isi ${option.name}`).slice(0, 100))
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(option.required)
      .setMaxLength(option.max_length || 1000);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
  });

  return modal;
}

function createModalInteraction(interaction, values) {
  const getUser = (value) => {
    if (!value) return null;
    const userId = value.replace(/[<@!>]/g, '');
    return interaction.guild?.members.cache.get(userId)?.user
      || interaction.client.users.cache.get(userId)
      || null;
  };

  const commandInteraction = Object.create(interaction);
  commandInteraction.options = {
    getString: (name, required = false) => {
      const value = values[name] || null;
      if (required && !value) throw new Error(`Argumen ${name} wajib diisi.`);
      return value;
    },
    getInteger: (name) => {
      const value = Number.parseInt(values[name], 10);
      return Number.isNaN(value) ? null : value;
    },
    getUser: (name) => getUser(values[name]),
    getAttachment: () => null
  };

  return commandInteraction;
}

module.exports = {
  data: {
    name: 'menu',
    description: 'Tampilkan menu bot.'
  },

  setCommands,
  setCommandGuard,
  createMenuMessage,

  /* =======================================================
     EXECUTE
  ======================================================= */

  async execute(interaction) {
    const menu = createMenuMessage(
      interaction.client,
      interaction.guild,
      interaction.user,
      interaction.member
    );

    return interaction.reply(menu);
  },

  /* =======================================================
     HANDLE INTERACTION
  ======================================================= */

  async handleInteraction(interaction) {

    /* -----------------------------------------------------
       MENU COMMANDS
    ----------------------------------------------------- */

    if (
      interaction.customId === 'menu_commands'
    ) {
      return interaction.reply({
        content:
          '👇 Pilih command yang ingin digunakan:',
        components: [
          createCommandSelect()
        ],
        ephemeral: true
      });
    }

    /* -----------------------------------------------------
       SELECT COMMAND
    ----------------------------------------------------- */

    if (
      interaction.customId === 'menu_command_select'
    ) {
      const name =
        interaction.values[0];

      const command = commands.get(name);
      if (!command) {
        return interaction.reply({ content: '⚠️ Command tidak ditemukan.', ephemeral: true });
      }

      if (name === 'pp') {
        return interaction.reply({
          content: `🖼️ Untuk melihat foto profil, ketik \`${prefix}pp @user\` di chat. Jika tanpa mention, foto profil kamu yang ditampilkan.`,
          ephemeral: true
        });
      }

      if (name === 'toimg') {
        return interaction.reply({
          content: `🖼️ Reply pesan yang berisi sticker/gambar, lalu ketik \`${prefix}toimg\` di chat.`,
          ephemeral: true
        });
      }

      const options = getCommandOptions(command);
      if (options.length) {
        return interaction.showModal(createInputModal(command, 0, interaction.id));
      }

      if (!await commandGuard(interaction, command)) return;
      return command.execute(interaction);
    }

    if (interaction.customId.startsWith('menu_input:')) {
      const [, name, pageValue, sessionId] = interaction.customId.split(':');
      const page = Number.parseInt(pageValue, 10);
      const command = commands.get(name);
      if (!command) {
        return interaction.reply({
          content: '⚠️ Command tidak ditemukan.',
          ephemeral: true
        });
      }

      const values = modalValues.get(sessionId) || {};
      getCommandOptions(command).slice(page * 5, page * 5 + 5).forEach((option) => {
        values[option.name] = interaction.fields
          .getTextInputValue(`menu_option:${option.name}`)
          .trim() || null;
      });

      const nextPage = page + 1;
      if (nextPage * 5 < getCommandOptions(command).length) {
        modalValues.set(sessionId, values);
        return interaction.showModal(createInputModal(command, nextPage, sessionId));
      }

      modalValues.delete(sessionId);
      const commandInteraction = createModalInteraction(interaction, values);
      if (!await commandGuard(commandInteraction, command)) return;
      return command.execute(commandInteraction);
    }
  }
};