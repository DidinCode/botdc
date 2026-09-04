const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');

if (!Canvas.CanvasRenderingContext2D.prototype.roundRect) {
    Canvas.CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (r > w/2) r = w/2;
        if (r > h/2) r = h/2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
    };
}

module.exports = {
    data: {
        name: 'love',
        description: 'Cek kecocokan cinta dengan seseorang 💖',
        options: [
            {
                name: 'user',
                description: 'User yang ingin dicek kecocokannya 💘',
                type: 6,
                required: true
            }
        ]
    },
    
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply('🚫 Command ini hanya bisa dipakai di server Discord.');
        }

        const targetUser = interaction.options.getUser('user');
        const authorUser = interaction.user;

        if (targetUser.id === authorUser.id) {
            return interaction.reply('Masa nge-love diri sendiri sih? 😅 Coba cari yang lain!');
        }

        if (targetUser.bot) {
            return interaction.reply('Maaf, bot tidak punya perasaan 🤖💔');
        }

        await interaction.deferReply();

        try {
            const authorMember = await interaction.guild.members.fetch(authorUser.id);
            const targetMember = await interaction.guild.members.fetch(targetUser.id);

            const authorAvatarURL = authorUser.displayAvatarURL({ extension: 'png', size: 512 });
            const targetAvatarURL = targetUser.displayAvatarURL({ extension: 'png', size: 512 });

            const matchScore = Math.floor(Math.random() * 100) + 1;

            const canvas = Canvas.createCanvas(900, 500);
            const ctx = canvas.getContext('2d');

            const bgGradient = ctx.createLinearGradient(0, 0, 900, 500);
            bgGradient.addColorStop(0, '#0f0c29'); 
            bgGradient.addColorStop(0.5, '#302b63'); 
            bgGradient.addColorStop(1, '#24243e');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.beginPath();
            ctx.roundRect(40, 40, 820, 420, 24);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '2px';
            ctx.fillText('LOVE COMPATIBILITY', 450, 90);

            const authorAvatar = await Canvas.loadImage(authorAvatarURL);
            const targetAvatar = await Canvas.loadImage(targetAvatarURL);

            function drawModernAvatar(image, x, y, size, color, name) {
                ctx.beginPath();
                ctx.arc(x + size/2, y + size/2, (size/2) + 6, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 20;
                ctx.fill();
                ctx.shadowBlur = 0; 

                ctx.save();
                ctx.beginPath();
                ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(image, x, y, size, size);
                ctx.restore();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'center';
                
                let displayName = name;
                if (ctx.measureText(displayName).width > 160) {
                    displayName = displayName.substring(0, 12) + '...';
                }
                ctx.fillText(displayName, x + size/2, y + size + 35);
            }

            drawModernAvatar(authorAvatar, 180, 130, 150, '#ff4b82', authorMember.displayName);
            drawModernAvatar(targetAvatar, 570, 130, 150, '#7b2cbf', targetMember.displayName);

            ctx.fillStyle = '#ff4b82';
            ctx.shadowColor = '#ff4b82';
            ctx.shadowBlur = 15;
            ctx.font = 'bold 65px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${matchScore}%`, 450, 210);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ffffff';
            ctx.font = '40px sans-serif';
            ctx.fillText('💖', 450, 260);

            const barWidth = 600;
            const barHeight = 16;
            const barX = 150;
            const barY = 350;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth, barHeight, 8);
            ctx.fill();

            const fillGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            fillGradient.addColorStop(0, '#ff4b82');
            fillGradient.addColorStop(1, '#7b2cbf');
            
            ctx.fillStyle = fillGradient;
            ctx.shadowColor = '#ff4b82';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(barX, barY, (matchScore / 100) * barWidth, barHeight, 8);
            ctx.fill();
            ctx.shadowBlur = 0;

            let motivation;
            if (matchScore <= 30) {
                motivation = '💔 Ditolak Realita: Cinta emang nggak bisa dipaksa. Mending fokus perbaiki diri dan coding aja, bro!';
            } else if (matchScore <= 60) {
                motivation = '🤔 Status Digantung: Kecocokan nanggung. Butuh effort ekstra kalau mau nge-push ke pelaminan!';
            } else if (matchScore <= 85) {
                motivation = '✨ Chemistry Dapet: Ada percikan asmara nih! Coba sering-sering ajak jalan, peluang diterima gede!';
            } else {
                motivation = '💍 Fix Jodoh: Udah ini mah nggak usah mikir lagi, langsung gas sebar undangan! 🎉';
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            
            const words = motivation.split(' ');
            let line = '';
            let yText = 400;
            const lineHeight = 26;
            const maxWidth = 700;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    ctx.fillText(line, 450, yText);
                    line = words[n] + ' ';
                    yText += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, 450, yText); 

            const buffer = canvas.toBuffer();
            const attachment = new AttachmentBuilder(buffer, { name: 'love-match-aesthetic.png' });

            await interaction.editReply({
                content: `💖 Kecocokan **${authorMember.displayName}** & **${targetMember.displayName}** telah dihitung! 🪄`,
                files: [attachment]
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Terjadi error saat memproses canvas. Pastikan dependensi aman.');
        }
    }
};