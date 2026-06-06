const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { dbPath, normalizeUser } = require('../lib/db');

const parseDb = () => {
    try {
        if (!fs.existsSync(dbPath)) return {};
        const raw = fs.readFileSync(dbPath, 'utf8');
        return raw.trim() ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Puan/mesaj/ses sıralamasını gösterir.')
        .addStringOption(opt =>
            opt
                .setName('tip')
                .setDescription('Hangi sıralama?')
                .setRequired(true)
                .addChoices(
                    { name: 'Puan', value: 'puan' },
                    { name: 'Mesaj', value: 'mesaj' },
                    { name: 'Ses (dk)', value: 'ses' }
                )
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ Bu komut sadece sunucuda kullanılabilir.', ephemeral: true });
        }

        const tip = interaction.options.getString('tip');
        const db = parseDb();

        const items = Object.entries(db).map(([id, data]) => {
            const u = normalizeUser(data);
            return {
                id,
                username: u.username,
                puan: u.puan,
                messageCount: u.messageCount,
                voiceTime: u.voiceTime,
            };
        });

        const key = tip === 'mesaj' ? 'messageCount' : (tip === 'ses' ? 'voiceTime' : 'puan');
        const title = tip === 'mesaj' ? '💬 Mesaj Sıralaması' : (tip === 'ses' ? '🔊 Ses Sıralaması (dk)' : '🏆 Puan Sıralaması');

        const sorted = items
            .filter(i => (i[key] || 0) > 0)
            .sort((a, b) => (b[key] || 0) - (a[key] || 0))
            .slice(0, 10);

        if (sorted.length === 0) {
            return interaction.reply({ content: 'ℹ️ Henüz veri yok.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor('#f1c40f')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp();

        let desc = '';
        for (let i = 0; i < sorted.length; i++) {
            const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '🔹'));
            desc += `${medal} **${i + 1}.** <@${sorted[i].id}> ➜ \`${sorted[i][key]}\`\n`;
        }
        embed.setDescription(desc);

        return interaction.reply({ embeds: [embed] });
    }
};
