const { SlashCommandBuilder } = require('discord.js');
const {
  getVoiceConnection,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  StreamType,
  AudioPlayerStatus
} = require('@discordjs/voice');
const { Readable } = require('node:stream');
const { musicApi } = require('../config');

const guildPlayers = new Map();
const guildCleanupTimers = new Map();

function clearGuildCleanupTimer(guildId) {
  const timer = guildCleanupTimers.get(guildId);
  if (timer) {
    clearTimeout(timer);
    guildCleanupTimers.delete(guildId);
  }
}

function scheduleGuildCleanup(guildId, seconds = 15) {
  clearGuildCleanupTimer(guildId);

  const timer = setTimeout(() => {
    stopGuildAudio(guildId);
  }, seconds * 1000);

  guildCleanupTimers.set(guildId, timer);
}

function getApiUrlFromLink(link) {
  const { baseUrl, apiKey } = musicApi;
  return `${baseUrl}/ytmp3?api=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(link)}&format=mp3`;
}

function extractDownloadUrl(data) {
  if (!data || typeof data !== 'object') return null;

  const candidates = [
    data.download,
    data.url,
    data.link,
    data.file,
    data.data?.download,
    data.data?.url,
    data.result?.download,
    data.result?.url,
    data.result?.link,
    data.result?.file,
    data.result?.data?.download,
    data.result?.data?.url
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function fetchAudioResponse(url) {
  const apiUrl = getApiUrlFromLink(url);
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  if (!response.ok) {
    throw new Error(`API gagal merespons dengan status ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json();
    const extractedUrl = extractDownloadUrl(data);

    if (!extractedUrl) {
      throw new Error('Respons API tidak mengembalikan URL audio yang valid.');
    }

    const audioResponse = await fetch(extractedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!audioResponse.ok) {
      throw new Error(`Gagal mengambil file audio: ${audioResponse.status}`);
    }

    return audioResponse;
  }

  if (contentType.startsWith('audio/') || contentType.includes('mpeg') || contentType.includes('octet-stream')) {
    return response;
  }

  const text = await response.text();
  try {
    const data = JSON.parse(text);
    const extractedUrl = extractDownloadUrl(data);

    if (!extractedUrl) {
      throw new Error('Respons API tidak mengembalikan URL audio yang valid.');
    }

    const audioResponse = await fetch(extractedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!audioResponse.ok) {
      throw new Error(`Gagal mengambil file audio: ${audioResponse.status}`);
    }

    return audioResponse;
  } catch (error) {
    throw new Error('Respons API tidak mengembalikan URL audio yang valid.');
  }
}

function stopGuildAudio(guildId) {
  clearGuildCleanupTimer(guildId);

  const player = guildPlayers.get(guildId);
  const connection = getVoiceConnection(guildId);

  if (!player && !connection) {
    return false;
  }

  if (player) {
    try {
      player.stop();
    } catch (error) {
      // ignore stop errors
    }
    guildPlayers.delete(guildId);
  }

  if (connection) {
    try {
      connection.destroy();
    } catch (error) {
      // ignore destroy errors
    }
  }

  return true;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Mainkan lagu dari link YouTube ke voice channel 🎵')
    .addStringOption((option) =>
      option
        .setName('link')
        .setDescription('Link YouTube yang mau diputar 🔗')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    if (!interaction.guild) {
      return interaction.editReply('🚫 Command !play hanya bisa dipakai di server Discord.');
    }

    const memberVoice = interaction.member?.voice?.channel;
    const link = interaction.options.getString('link', true);

    if (!memberVoice) {
      return interaction.editReply('🔊 Kamu harus masuk voice channel dulu sebelum pakai !play.');
    }

    try {
      const guildId = interaction.guild?.id;
      if (!guildId) {
        return interaction.editReply('⚠️ Server Discord tidak terdeteksi. Jalankan !play di channel server.');
      }

      const response = await fetchAudioResponse(link);
      if (!response.body) {
        throw new Error('File audio tidak bisa diunduh dari API.');
      }

      let connection = getVoiceConnection(guildId);
      if (!connection) {
        connection = joinVoiceChannel({
          channelId: memberVoice.id,
          guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false
        });
      } else if (connection.joinConfig.channelId !== memberVoice.id) {
        return interaction.editReply(`⚠️ Bot sudah aktif di <#${connection.joinConfig.channelId}>. Pakai !stop dulu atau pindah ke channel yang sama.`);
      }

      clearGuildCleanupTimer(guildId);

      const existingPlayer = guildPlayers.get(guildId);
      if (existingPlayer) {
        try {
          existingPlayer.stop();
        } catch (error) {
          // ignore stop errors
        }
      }

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });

      const resource = createAudioResource(Readable.fromWeb(response.body), {
        inputType: StreamType.Arbitrary
      });

      guildPlayers.set(guildId, player);
      connection.subscribe(player);
      player.play(resource);

      player.on('stateChange', (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
          guildPlayers.delete(guildId);
        }
      });

      player.on('error', () => {
        guildPlayers.delete(guildId);
      });

      return interaction.editReply('🎶 Sedang memutar lagu dari link yang kamu kirim...');
    } catch (error) {
      const guildId = interaction.guild?.id;
      if (!guildId) {
        return interaction.editReply(`⚠️ Gagal memutar lagu: server Discord tidak terdeteksi.`);
      }
      guildPlayers.delete(guildId);
      return interaction.editReply(`❌ Gagal memutar lagu: ${error.message}`);
    }
  },

  stopGuildAudio
};
