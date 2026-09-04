const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const sessions = new Map();
const apiUrl = process.env.TEBAK_GAMBAR_API_URL || 'https://anabot.my.id/api/games/fun/tebakgambar?apikey=freeApikey';

function normalizeAnswer(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function createActiveButtons(sessionId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tebakgambar_answer:${sessionId}`)
      .setLabel('💬 Jawab')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`tebakgambar_clue:${sessionId}`)
      .setLabel('💡 Clue')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`tebakgambar_stop:${sessionId}`)
      .setLabel('🛑 Stop')
      .setStyle(ButtonStyle.Danger)
  );
}

function createDisabledButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('tebakgambar_answer_disabled')
      .setLabel('💬 Jawab')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('tebakgambar_clue_disabled')
      .setLabel('💡 Clue')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('tebakgambar_stop_disabled')
      .setLabel('🛑 Stop')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );
}

function createAnswerModal(sessionId) {
  const input = new TextInputBuilder()
    .setCustomId('tebakgambar_input')
    .setLabel('✍️ Tulis jawaban kamu')
    .setPlaceholder('Masukkan tebakan kamu 🤔')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(200)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(`tebakgambar_modal:${sessionId}`)
    .setTitle('🧩 Jawab Tebak Gambar')
    .addComponents(new ActionRowBuilder().addComponents(input));
}

function createClue(session) {
  const words = normalizeAnswer(session.answer).split(' ');
  const lengths = words.map((word) => word.length).join(' - ');
  const initials = words.map((word) => word[0].toUpperCase()).join(' - ');
  session.clueUses += 1;

  if (session.clueUses === 1 && session.description) {
    return `💡 Clue 1: ${session.description}`;
  }
  if (session.clueUses <= 2) {
    return `💡 Clue 2: Jawaban terdiri dari ${words.length} kata, dengan pola jumlah huruf ${lengths}.`;
  }
  return `💡 Clue 3: Huruf awal setiap kata adalah ${initials}.`;
}

async function fetchQuestion() {
  const response = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!response.ok) throw new Error(`API gagal merespons dengan status ${response.status}.`);

  const payload = await response.json();
  const question = payload?.data;
  if (!question || typeof question.img !== 'string' || !/^https?:\/\//i.test(question.img)) {
    throw new Error('Respons API tidak mengembalikan gambar soal yang valid.');
  }
  if (typeof question.jawaban !== 'string' || !question.jawaban.trim()) {
    throw new Error('Respons API tidak mengembalikan jawaban yang valid.');
  }

  return {
    image: question.img,
    answer: question.jawaban.trim(),
    description: typeof question.deskripsi === 'string' ? question.deskripsi.trim() : ''
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tebakgambar')
    .setDescription('Main tebak gambar dari soal acak 🧩'),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const question = await fetchQuestion();
      const sessionId = interaction.id;
      sessions.set(sessionId, { ...question, userId: interaction.user.id, clueUses: 0 });

      return interaction.editReply({
        content: '🧩 Tebak gambar ini. Gunakan 💬 Jawab untuk memasukkan tebakan, 💡 Clue untuk petunjuk, atau 🛑 Stop untuk mengakhiri.',
        files: [{ attachment: question.image, name: 'tebakgambar.jpg' }],
        components: [createActiveButtons(sessionId)]
      });
    } catch (error) {
      return interaction.editReply(`❌ Gagal mengambil soal tebak gambar: ${error.message}`);
    }
  },

  async handleInteraction(interaction) {
    const sessionId = interaction.customId.split(':')[1];
    const session = sessions.get(sessionId);
    if (!session) return interaction.reply({ content: '⚠️ Soal ini sudah tidak tersedia.', ephemeral: true });
    if (session.userId !== interaction.user.id) {
      return interaction.reply({ content: '🔒 Hanya pembuat soal yang bisa memakai tombol ini.', ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('tebakgambar_answer:')) {
      return interaction.showModal(createAnswerModal(sessionId));
    }

    if (interaction.isButton() && interaction.customId.startsWith('tebakgambar_clue:')) {
      return interaction.reply({ content: createClue(session), ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId.startsWith('tebakgambar_stop:')) {
      sessions.delete(sessionId);
      return interaction.update({
        content: '🛑 Permainan tebak gambar dihentikan oleh pembuat soal.',
        components: [createDisabledButtons()]
      });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('tebakgambar_modal:')) {
      const guess = interaction.fields.getTextInputValue('tebakgambar_input').trim();
      if (normalizeAnswer(guess) !== normalizeAnswer(session.answer)) {
        return interaction.reply({ content: '❌ Jawaban masih salah. Coba lagi.', ephemeral: true });
      }

      sessions.delete(sessionId);
      return interaction.update({
        content: `🎉 Benar! Jawabannya: ${session.answer}`,
        components: [createDisabledButtons()]
      });
    }
  }
};