const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { withDb, normalizeUser } = require('../lib/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('puansil')
        .setDescription('Belirtilen kullanıcıdan puan siler.')
        .addUserOption(option =>
            option.setName('kullanici').setDescription('Puanı silinecek kullanıcıyı seçin.').setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('miktar').setDescription('Silinecek puan miktarı').setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const user = interaction.options.getUser('kullanici');
        const miktar = interaction.options.getInteger('miktar');

        if (!miktar || miktar <= 0) {
            return interaction.reply({ content: '❌ Silinecek miktar 0’dan büyük olmalı.', ephemeral: true });
        }

        let yeniPuan = 0;
        let hadData = true;

        await withDb((db) => {
            if (!db[user.id]) {
                hadData = false;
                return;
            }
            const u = normalizeUser(db[user.id], user.username);
            u.puan = Math.max(0, (u.puan || 0) - miktar);
            u.username = user.username;
            db[user.id] = u;
            yeniPuan = u.puan;
        });

        if (!hadData) {
            return interaction.reply({ content: `❌ **${user.username}** için kayıt bulunamadı.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('📉 Puan Silindi')
            .setColor('#e74c3c')
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Kullanıcı', value: `${user}`, inline: true },
                { name: '➖ Silinen', value: `\`${miktar}\``, inline: true },
                { name: '💰 Kalan Puan', value: `\`${yeniPuan}\``, inline: true }
            )
            .setFooter({ text: `${interaction.user.tag} tarafından işlem yapıldı.` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
