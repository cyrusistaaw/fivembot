const { get: getSetting } = require('./settings');

const sendErrorLog = async (client, text) => {
    try {
        const channelId = getSetting('ERROR_LOG') || getSetting('GIRIS_CIKIS');
        if (!channelId || !client?.isReady?.()) return;

        const ch = await client.channels.fetch(channelId).catch(() => null);
        if (!ch) return;

        const msg = String(text || '').slice(0, 1800);
        await ch.send({ content: `\uD83E\uDDEF Bot Hatası\n\`\`\`\n${msg}\n\`\`\`` }).catch(() => {});
    } catch {}
};

module.exports = { sendErrorLog };
