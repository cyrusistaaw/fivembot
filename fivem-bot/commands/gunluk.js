const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { withDb, normalizeUser } = require('../lib/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gunluk')
        .setDescription('Günlük şans puanını topla.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const cooldownMs = 24 * 60 * 60 * 1000;

        let remainingMs = 0;
        let randomPuan = 0;

        await withDb((db) => {
            const user = normalizeUser(db[userId], interaction.user.username);

            const lastDaily = user.dailyLast || 0;
            remainingMs = lastDaily ? (cooldownMs - (Date.now() - lastDaily)) : 0;

            if (lastDaily && remainingMs > 0) {
                db[userId] = user;
                return;
            }

            randomPuan = Math.floor(Math.random() * 8) + 2; // 2-10
            user.puan += randomPuan;
            user.dailyLast = Date.now();
            user.username = interaction.user.username;
            db[userId] = user;
        });

        if (remainingMs > 0) {
            const hours = Math.floor(remainingMs / (1000 * 60 * 60));
            const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            return interaction.reply({
                content: `⏳ Bugünlük aldın. Tekrar denemek için **${hours}s ${minutes}dk** beklemen gerek.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎁 Günlük Bonus')
            .setDescription(`Bugün kasadan senin için **${randomPuan} Puan** çıktı!`)
            .setColor('#9b59b6')
            .setFooter({ text: 'Yarın tekrar gelmeyi unutma!' });

        return interaction.reply({ embeds: [embed] });
    }
};
