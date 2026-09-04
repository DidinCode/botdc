const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const { token, clientId, prefix } = require('./config');
const pingCommand = require('./commands/ping');
const ppCommand = require('./commands/pp');
const afkCommand = require('./commands/afk');
const toimgCommand = require('./commands/toimg');
const kickCommand = require('./commands/kick');
const banCommand = require('./commands/ban');
const penjagaCommand = require('./commands/penjaga');
const pengaturanCommand = require('./commands/pengaturan');
const playCommand = require('./commands/play');
const stopCommand = require('./commands/stop');
const iphoneCommand = require('./commands/iphone');
const tiktokCommand = require('./commands/tiktok');
const tebakgambarCommand = require('./commands/tebakgambar');
const windowsCommand = require('./commands/windows');
const wargaCommand = require('./commands/warga');
const menuCommand = require('./commands/menu');
const tololCommand = require('./commands/tolol');
const loveCommand = require('./commands/love');
const daftarCommand = require('./commands/daftar');
const limitCommand = require('./commands/limit');
const profileCommand = require('./commands/profile');
const { getUser, useLimit, addLimit } = require('./lib/userStore');
const { ownerId } = require('./config');

const lockPath = path.join(__dirname, '.bot.lock');
let lockHandle;

try {
  lockHandle = fs.openSync(lockPath, 'wx');
  fs.writeSync(lockHandle, String(process.pid));
} catch (error) {
  if (error.code !== 'EEXIST') throw error;

  const existingPid = Number.parseInt(fs.readFileSync(lockPath, 'utf8'), 10);
  try {
    process.kill(existingPid, 0);
    console.error(`Bot sudah berjalan di proses ${existingPid}. Hentikan proses itu sebelum menjalankan bot lagi.`);
    process.exit(1);
  } catch {
    fs.unlinkSync(lockPath);
    lockHandle = fs.openSync(lockPath, 'wx');
    fs.writeSync(lockHandle, String(process.pid));
  }
}

function releaseLock() {
  if (lockHandle === undefined) return;
  fs.closeSync(lockHandle);
  fs.unlinkSync(lockPath);
  lockHandle = undefined;
}

process.on('exit', releaseLock);
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

global.afkUsers = global.afkUsers || new Map();
const handledMessageIds = new Set();

function formatAfkDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds} detik`;
  if (seconds === 0) return `${minutes} menit`;
  return `${minutes} menit ${seconds} detik`;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences
  ]
});

client.once(Events.ClientReady, async () => {
  const rest = new REST({ version: '10' }).setToken(token);
  for (const guild of client.guilds.cache.values()) {
    await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: [] }).catch((error) => {
      console.error(`Gagal menghapus slash command di guild ${guild.id}:`, error.message);
    });
  }
  console.log(`Bot online: ${client.user.tag} | Prefix: ${prefix}`);
});

const prefixCommands = new Map([
  pingCommand, ppCommand, afkCommand, toimgCommand, kickCommand, banCommand,
  penjagaCommand, pengaturanCommand, playCommand, stopCommand, iphoneCommand,
  tiktokCommand, tebakgambarCommand, windowsCommand, wargaCommand, menuCommand,
  tololCommand, loveCommand, daftarCommand, limitCommand, profileCommand
].map((command) => [command.data.name, command]));

const guildOnlyCommands = new Set([
  'ban', 'kick', 'penjaga', 'pengaturan', 'play', 'stop', 'love'
]);
const hiddenCommands = new Set(['limit']);
menuCommand.setCommands(new Map([...prefixCommands].filter(([name]) => !hiddenCommands.has(name))));
const freeCommands = new Set(['daftar', 'limit', 'profile']);
menuCommand.setCommandGuard(async (interaction, command) => {
  if (freeCommands.has(command.data.name) || interaction.user.id === ownerId) return true;
  if (!getUser(interaction.user.id)) {
    await interaction.reply({ content: `📝 Kamu belum terdaftar. Gunakan **${prefix}daftar** terlebih dahulu.`, ephemeral: true });
    return false;
  }
  if (!useLimit(interaction.user.id)) {
    await interaction.reply({ content: '💳 Limit kamu habis. Limit akan reset otomatis besok.', ephemeral: true });
    return false;
  }
  return true;
});

function parseArguments(input) {
  const matches = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  return matches.map((value) => value.replace(/^"|"$/g, ''));
}

function createMessageInteraction(message, command, args) {
  const options = {};
  const definitions = command.data.toJSON
    ? command.data.toJSON().options || []
    : command.data.options || [];
  const values = definitions.length === 1
    ? [args.join(' ')]
    : (args.join(' ').includes('|') ? args.join(' ').split('|').map((value) => value.trim()) : args);

  definitions.forEach((definition, index) => {
    options[definition.name] = values[index] || null;
  });

  const getUser = (value) => {
    if (!value) return null;
    return message.mentions.users.first()
      || message.guild?.members.cache.get(value.replace(/[<@!>]/g, ''))?.user
      || null;
  };

  const send = async (payload) => {
    const normalized = typeof payload === 'string' ? { content: payload } : payload;
    return message.reply(normalized);
  };

  return {
    client,
    id: message.id,
    user: message.author,
    member: message.member,
    guild: message.guild,
    channel: message.channel,
    reference: message.reference,
    createdTimestamp: message.createdTimestamp,
    options: {
      getString: (name, required = false) => {
        const value = options[name];
        if (required && !value) throw new Error(`Argumen ${name} wajib diisi.`);
        return value;
      },
      getInteger: (name) => {
        const value = Number.parseInt(options[name], 10);
        return Number.isNaN(value) ? null : value;
      },
      getUser,
      getAttachment: () => message.attachments.first() || null
    },
    deferReply: async () => undefined,
    reply: send,
    editReply: send,
    followUp: send
  };
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('menu_')) {
        await menuCommand.handleInteraction(interaction);
        return;
      }
      if (interaction.customId.startsWith('pengaturan_')) {
        await pengaturanCommand.handleInteraction(interaction);
        return;
      }

      if (interaction.customId.startsWith('tiktok_audio:') || interaction.customId.startsWith('tiktok_close:')) {
        await tiktokCommand.handleInteraction(interaction);
        return;
      }

      if (interaction.customId.startsWith('tebakgambar_answer:')
        || interaction.customId.startsWith('tebakgambar_clue:')
        || interaction.customId.startsWith('tebakgambar_modal:')) {
        await tebakgambarCommand.handleInteraction(interaction);
        return;
      }

    }
  } catch (error) {
    if (error && (error.code === 10062 || error.code === 40060)) {
      return;
    }
    console.error('Interaction error:', error);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (handledMessageIds.has(message.id)) return;
  handledMessageIds.add(message.id);
  setTimeout(() => handledMessageIds.delete(message.id), 60_000).unref();

  if (message.content.startsWith(prefix)) {
    const input = message.content.slice(prefix.length).trim();
    const [name, ...args] = parseArguments(input);
    const command = prefixCommands.get(name?.toLowerCase());

    if (command) {
      if (guildOnlyCommands.has(command.data.name) && !message.guild) {
        await message.reply('🚫 Command ini hanya bisa dipakai di server Discord, bukan di DM.');
        return;
      }

      if (!freeCommands.has(command.data.name) && message.author.id !== ownerId && !getUser(message.author.id)) {
        await message.reply(`📝 Kamu belum terdaftar. Gunakan **${prefix}daftar** terlebih dahulu.`);
        return;
      }

      const isBillable = !freeCommands.has(command.data.name) && message.author.id !== ownerId;
      if (isBillable && !useLimit(message.author.id)) {
        await message.reply('💳 Limit kamu habis. Limit akan reset otomatis besok.');
        return;
      }

      try {
        await command.execute(createMessageInteraction(message, command, args));
      } catch (error) {
        if (isBillable) addLimit(message.author.id, 1);
        console.error(`Command !${command.data.name} error:`, error.stack || error);
        await message.reply(`❌ Gagal menjalankan !${command.data.name}: ${error.message}`).catch(() => null);
      }
      return;
    }
  }

  const afkEntry = global.afkUsers.get(message.author.id);
  if (afkEntry) {
    const duration = formatAfkDuration(Date.now() - afkEntry.startedAt);
    global.afkUsers.delete(message.author.id);
    return message.reply(
      `👋 ${message.author} sudah kembali. AFK selama ${duration} dengan alasan: **${afkEntry.reason}**`
    );
  }

  for (const [userId, userData] of global.afkUsers.entries()) {
    if (message.mentions.users.has(userId)) {
      const duration = formatAfkDuration(Date.now() - userData.startedAt);
      return message.reply(
        `😴 <@${userId}> sedang AFK. Alasan: **${userData.reason}**. Sudah ${duration}.`
      );
    }
  }
});

client.login(token);