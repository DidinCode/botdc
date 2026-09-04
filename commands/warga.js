const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warga')
    .setDescription('Buat ID Card/e-KTP Warga Server 🪪')
    .addStringOption(option => option.setName('nik').setDescription('Nomor Induk Kependudukan (Angka) 🔢').setRequired(true))
    .addStringOption(option => option.setName('nama').setDescription('Nama Lengkap 👤').setRequired(true))
    .addStringOption(option => option.setName('ttl').setDescription('Tempat, Tanggal Lahir (ex: Bandung, 01-01-2000) 🎂').setRequired(true))
    .addStringOption(option => option.setName('jenis_kelamin').setDescription('Jenis Kelamin ⚧️').setRequired(true).addChoices(
      { name: 'Laki-laki ♂️', value: 'Laki-laki' },
      { name: 'Perempuan ♀️', value: 'Perempuan' }
    ))
    .addStringOption(option => option.setName('golongan_darah').setDescription('Golongan Darah (A/B/AB/O/-) 🩸').setRequired(true))
    .addStringOption(option => option.setName('alamat').setDescription('Alamat Lengkap 🏠').setRequired(true))
    .addStringOption(option => option.setName('rt_rw').setDescription('RT/RW (ex: 001/002) 📍').setRequired(true))
    .addStringOption(option => option.setName('kel_desa').setDescription('Kelurahan / Desa 🌆').setRequired(true))
    .addStringOption(option => option.setName('kecamatan').setDescription('Kecamatan 🗺️').setRequired(true))
    .addStringOption(option => option.setName('agama').setDescription('Agama 🙏').setRequired(true))
    .addStringOption(option => option.setName('status').setDescription('Status Perkawinan 💍').setRequired(true))
    .addStringOption(option => option.setName('pekerjaan').setDescription('Pekerjaan 💼').setRequired(true))
    .addStringOption(option => option.setName('kewarganegaraan').setDescription('Kewarganegaraan (ex: WNI) 🌏').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const nik = interaction.options.getString('nik');
    const nama = interaction.options.getString('nama');
    const ttl = interaction.options.getString('ttl');
    const jenis_kelamin = interaction.options.getString('jenis_kelamin');
    const golongan_darah = interaction.options.getString('golongan_darah');
    const alamat = interaction.options.getString('alamat');
    const rt_rw = interaction.options.getString('rt_rw');
    const kel_desa = interaction.options.getString('kel_desa');
    const kecamatan = interaction.options.getString('kecamatan');
    const agama = interaction.options.getString('agama');
    const status = interaction.options.getString('status');
    const pekerjaan = interaction.options.getString('pekerjaan');
    const kewarganegaraan = interaction.options.getString('kewarganegaraan');

    const provinsi = "WARGA BARU";
    const kota = interaction.guild ? interaction.guild.name.toUpperCase() : "SERVER DISCORD";
    const masa_berlaku = "Seumur Hidup";
    
    const today = new Date();
    const terbuat = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    const pas_photo = interaction.user.displayAvatarURL({ extension: 'png', size: 1024, forceStatic: true });

    const apiUrl = new URL('https://api.siputzx.my.id/api/canvas/ektp');
    apiUrl.searchParams.append('provinsi', provinsi);
    apiUrl.searchParams.append('kota', kota);
    apiUrl.searchParams.append('nik', nik);
    apiUrl.searchParams.append('nama', nama);
    apiUrl.searchParams.append('ttl', ttl);
    apiUrl.searchParams.append('jenis_kelamin', jenis_kelamin);
    apiUrl.searchParams.append('golongan_darah', golongan_darah);
    apiUrl.searchParams.append('alamat', alamat);
    apiUrl.searchParams.append('rt/rw', rt_rw);
    apiUrl.searchParams.append('kel/desa', kel_desa);
    apiUrl.searchParams.append('kecamatan', kecamatan);
    apiUrl.searchParams.append('agama', agama);
    apiUrl.searchParams.append('status', status);
    apiUrl.searchParams.append('pekerjaan', pekerjaan);
    apiUrl.searchParams.append('kewarganegaraan', kewarganegaraan);
    apiUrl.searchParams.append('masa_berlaku', masa_berlaku);
    apiUrl.searchParams.append('terbuat', terbuat);
    apiUrl.searchParams.append('pas_photo', pas_photo);

    try {
      const attachment = new AttachmentBuilder(apiUrl.toString(), { name: 'ktp-warga.png' });
      await interaction.editReply({
        content: `🪪 KTP untuk **${nama}** berhasil dicetak di server **${kota}**!`,
        files: [attachment]
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Terjadi kesalahan saat memproses gambar KTP. Coba lagi nanti.');
    }
  },
};