const { EmbedBuilder, Events } = require('discord.js');
const { get: getSetting } = require('../lib/settings');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        if (!member?.guild) return;

        const kanalId = getSetting('GIRIS_CIKIS');
        if (!kanalId) return;

        const kanal = await client.channels.fetch(kanalId).catch(() => null);
        if (!kanal) return;

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Ayrılma', iconURL: member.user?.displayAvatarURL?.() })
            .setDescription(`📤 **${member.user?.tag || 'Bilinmiyor'}** aramızdan ayrıldı.`)
            .setColor('#e74c3c')
            .setTimestamp();

        kanal.send({ embeds: [embed] }).catch(() => {});
    }
};
