module.exports = function handler(request, response) {
  response.status(200).json({
    ok: true,
    service: 'discord-bot-api',
    message: 'Vercel aktif. Bot Gateway tetap harus dijalankan di hosting persistent.'
  });
};
