const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { withDb, normalizeUser } = require('../lib/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('puanver')
        .setDescription('Bir kullanıcıya puan ekler.')
        .addUserOption(option =>
            option.setName('kullanici').setDescription('Puan verilecek kullanıcı').setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('miktar').setDescription('Eklenecek puan miktarı').setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const user = interaction.options.getUser('kullanici');
        const miktar = interaction.options.getInteger('miktar');

        if (!miktar || miktar === 0) {
            return interaction.reply({ content: '❌ Miktar 0 olamaz.', ephemeral: true });
        }

        let newTotal = 0;
        await withDb((db) => {
            const u = normalizeUser(db[user.id], user.username);
            u.puan += miktar;
            u.username = user.username;
            db[user.id] = u;
            newTotal = u.puan;
        });

        const embed = new EmbedBuilder()
            .setTitle('✨ Puan Eklendi')
            .setColor('#2ecc71')
            .setDescription(`**${user.tag}** kullanıcısına \`${miktar}\` puan eklendi.`)
            .addFields({ name: '💰 Güncel Puan', value: `\`${newTotal}\`` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
