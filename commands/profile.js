const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { ownerId, menuThumbnail } = require('../config');
const { getUser } = require('../lib/userStore');

function getRandomColor() {
  return Math.floor(Math.random() * 0xffffff);
}

function getRole(interaction, member, user) {
  if (user.id === ownerId) return 'Owner bot';
  if (!member) return 'Tidak terdeteksi di server ini';
  if (member.id === interaction.guild.ownerId) return 'Owner server';
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return 'Administrator';
  return 'Member biasa';
}

function getDevices(member, user) {
  const clientStatus = member?.presence?.clientStatus || user.presence?.clientStatus;
  if (!clientStatus) return 'Offline / tidak terdeteksi';

  const devices = [];
  if (clientStatus.desktop) devices.push('Desktop');
  if (clientStatus.mobile) devices.push('Mobile');
  if (clientStatus.web) devices.push('Web');
  return devices.join(', ') || 'Online';
}

function getStatus(member) {
  const status = member?.presence?.status;
  if (!status || status === 'offline') return 'Offline';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

module.exports = {
  data: {
    name: 'profile',
    description: 'Lihat profile, role, device, limit, dan foto profil user.',
    options: [{
      name: 'user',
      description: 'User yang ingin dilihat profile-nya.',
      required: false,
      type: 6
    }]
  },

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild?.members.cache.get(user.id)
      || await interaction.guild?.members.fetch(user.id).catch(() => null);
    const storedUser = getUser(user.id);
    const avatar = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const profile = new EmbedBuilder()
      .setColor(getRandomColor())
      .setAuthor({ name: `Profile ${user.tag}`, iconURL: avatar })
      .setThumbnail(menuThumbnail)
      .addFields(
        { name: 'Username', value: user.tag, inline: true },
        { name: 'Role', value: getRole(interaction, member, user), inline: true },
        { name: 'Device', value: getDevices(member, user), inline: true },
        { name: 'Limit', value: storedUser ? `${storedUser.limit} limit` : 'Belum terdaftar', inline: true },
        { name: 'Status', value: getStatus(member), inline: true },
        { name: 'Bergabung', value: member?.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:D>` : 'Tidak tersedia', inline: true }
      )
      .setImage(avatar);

    return interaction.reply({ embeds: [profile] });
  }
};