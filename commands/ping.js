const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek respon, statistik, dan analitik server 📊'),

  async execute(interaction) {
    await interaction.deferReply();

    // 1. Data Dinamis Discord
    const latency = Date.now() - interaction.createdTimestamp; // Ping Pesan
    const apiPing = interaction.client.ws.ping; // WebSocket Ping
    const username = interaction.user.username;
    const serverName = interaction.guild ? interaction.guild.name : 'Direct Message';
    
    // Deteksi Role Berdasarkan Hirarki/Status di Server
    let roleName = 'Member';
    if (interaction.member) {
      if (interaction.member.id === interaction.guild?.ownerId) {
        roleName = 'Owner';
      } else if (interaction.member.permissions.has('Administrator')) {
        roleName = 'Administrator';
      } else if (interaction.member.premiumSince) {
        roleName = 'Server Booster';
      } else {
        const highestRole = interaction.member.roles.highest;
        if (highestRole && highestRole.name !== '@everyone') {
          roleName = highestRole.name;
        }
      }
    }

    // Simulasi Trafik Aktivitas (Jumlah command/interaksi user di server)
    // Di sini menggunakan nilai random/estimasi, bisa dihubungkan ke Database jika ada.
    const userCommandCount = Math.floor(Math.random() * 150) + 12; 
    const trafficPercent = "+14.2 PERCENT"; // Atau hitung berdasarkan kenaikan

    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const currentDate = new Date().toLocaleDateString('id-ID', dateOptions);

    // 2. Setup Canvas (Resolusi 680x900)
    const canvas = createCanvas(680, 900);
    const ctx = canvas.getContext('2d');

    function drawRoundRect(x, y, w, h, radius, fillStyle, strokeStyle = null) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
      }
    }

    // Background Utama
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background Card Putih
    drawRoundRect(40, 40, 600, 820, 30, '#ffffff', '#eaeaea');

    // Header: SERVER PING & Status
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('SERVER PING', 80, 110);
    
    drawRoundRect(410, 80, 190, 40, 20, '#f9f9f9', '#eeeeee'); 
    ctx.fillStyle = '#00d26a';
    ctx.beginPath();
    ctx.arc(435, 100, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`PING: ${latency}ms`, 450, 106);

    // User Info (Nama User & Nama Server)
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(username, 80, 190);
    ctx.fillStyle = '#888888';
    ctx.font = '22px sans-serif';
    // Batasi panjang nama server agar tidak keluar batas card
    let displayServerName = serverName.length > 25 ? serverName.substring(0, 22) + '...' : serverName;
    ctx.fillText(displayServerName, 80, 230);

    // Chart Area (Gunung) - Menampilkan Trafik Pemakaian Command User
    drawRoundRect(80, 270, 520, 180, 20, '#f9f9f9', '#f0f0f0');
    ctx.fillStyle = '#888888';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TRAFFIC ACTIVITY', 100, 310);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${userCommandCount} CMD`, 490, 310);

    // Render Grafik Gunung
    ctx.save();
    ctx.beginPath();
    ctx.rect(80, 330, 520, 120);
    ctx.clip();

    const grad = ctx.createLinearGradient(0, 330, 0, 450);
    grad.addColorStop(0, 'rgba(210, 210, 210, 0.6)');
    grad.addColorStop(1, 'rgba(245, 245, 245, 0)');
    
    ctx.beginPath();
    ctx.moveTo(80, 440);
    ctx.bezierCurveTo(150, 380, 200, 440, 280, 420);
    ctx.bezierCurveTo(360, 370, 420, 440, 520, 350);
    ctx.lineTo(600, 400);
    ctx.lineTo(600, 450);
    ctx.lineTo(80, 450);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(80, 440);
    ctx.bezierCurveTo(150, 380, 200, 440, 280, 420);
    ctx.bezierCurveTo(360, 370, 420, 440, 520, 350);
    ctx.lineTo(600, 400);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Fungsi Kotak Grid (Disesuaikan ukuran teks agar pas)
    function drawGridBox(x, y, title, value) {
      drawRoundRect(x, y, 250, 90, 15, '#f9f9f9', '#f0f0f0');
      ctx.fillStyle = '#888888';
      ctx.font = '16px sans-serif';
      ctx.fillText(title.toUpperCase(), x + 20, y + 32);
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 22px sans-serif';
      // Truncate teks jika terlalu panjang untuk kotak
      let valStr = String(value);
      if (valStr.length > 14) valStr = valStr.substring(0, 12) + '..';
      ctx.fillText(valStr, x + 20, y + 68);
    }

    // 4 Kotak Grid
    drawGridBox(80, 470, 'Role', roleName);
    drawGridBox(350, 470, 'Kecepatan', `${apiPing} ms`);
    drawGridBox(80, 580, 'Ping', `${latency} ms`);
    drawGridBox(350, 580, 'Device', 'Discord Client');

    // Tanggal Box (Font diperkecil dan diposisikan agar aman di dalam box)
    drawRoundRect(80, 690, 520, 80, 15, '#f9f9f9', '#f0f0f0');
    ctx.fillStyle = '#888888';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('TANGGAL', 100, 735);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 20px sans-serif'; // Ukuran font tanggal diperkecil agar tidak keluar box
    ctx.textAlign = 'right';
    ctx.fillText(currentDate, 560, 737);
    ctx.textAlign = 'left'; // Reset alignment

    // Footer
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px sans-serif';
    ctx.fillText('SYSTEM OK', 80, 820);
    ctx.textAlign = 'right';
    ctx.fillText('DidinCode 2026', 600, 820);
    ctx.textAlign = 'left';

    // 3. Kirim Hasil Gambar ke Discord
    const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'server-ping.png' });
    await interaction.editReply({ files: [attachment] });
  }
};