const {
    SlashCommandBuilder,
    AttachmentBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tolol')
        .setDescription('Buat sertifikat tolol dengan teks custom 🏅')
        .addStringOption(option =>
            option
                .setName('teks')
                .setDescription('Nama atau teks yang ingin dimasukkan ke sertifikat ✍️')
                .setRequired(true)
        ),

    async execute(interaction) {
        const isDiscordInteraction = typeof interaction.isRepliable === 'function';

        try {
            if (isDiscordInteraction) {
                await interaction.deferReply();
            }

            const send = (payload) => isDiscordInteraction
                ? interaction.editReply(payload)
                : interaction.reply(payload);
            const teks = interaction.options.getString('teks', true);

            console.log(
                `[TOLOL] ${interaction.id} | ${interaction.user.tag} | ${teks}`
            );

            // Special case
            if (teks.toLowerCase().includes('didin')) {
                return await send({
                    content:
                        '🤓 lgi ddia yang buat ak jir dia pintar, kau kali yg tolol goblok g ber otak!'
                });
            }

            const apiUrl =
                `https://api.siputzx.my.id/api/canvas/sertifikat-tolol?text=${encodeURIComponent(teks)}`;

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const attachment = new AttachmentBuilder(buffer, {
                name: 'sertifikat.png'
            });

            // SATU interaction = SATU reply
            await send({
                files: [attachment]
            });

        } catch (error) {
            console.error('[TOLOL ERROR]', error);

            if (isDiscordInteraction && interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Gagal mengambil sertifikat. API-nya mungkin lagi down.'
                }).catch(() => null);
            } else if (isDiscordInteraction && interaction.replied) {
                await interaction.followUp({
                    content: '❌ Gagal mengambil sertifikat. API-nya mungkin lagi down.'
                }).catch(() => null);
            } else {
                await interaction.reply({
                    content: '❌ Gagal mengambil sertifikat. API-nya mungkin lagi down.'
                }).catch(() => null);
            }
        }
    }
};