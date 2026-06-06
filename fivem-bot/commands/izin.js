const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get: getSetting } = require('../lib/settings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('izin')
        .setDescription('Aktiflik izni talebinde bulunur.')
        .addIntegerOption(opt =>
            opt.setName('gun').setDescription('Kaç gün?').setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('sebep').setDescription('Neden?').setRequired(true)
        ),

    async execute(interaction) {
        const kanalId = getSetting('IZIN_LOG');
        const gun = interaction.options.getInteger('gun');
        const sebep = interaction.options.getString('sebep');

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'İzin Talebi', iconURL: interaction.user.displayAvatarURL() })
            .addFields(
                { name: 'Kullanıcı', value: `${interaction.user}`, inline: true },
                { name: 'Süre', value: `${gun} Gün`, inline: true },
                { name: 'Sebep', value: `\`\`\`${sebep}\`\`\`` }
            )
            .setColor('#3498db')
            .setTimestamp();

        if (!kanalId) {
            return interaction.reply({ content: '❌ `IZIN_LOG` ayarlı değil.', ephemeral: true });
        }

        const kanal = await interaction.client.channels.fetch(kanalId).catch(() => null);
        if (!kanal) {
            return interaction.reply({ content: '❌ İzin kanalı bulunamadı!', ephemeral: true });
        }

        await kanal.send({ content: '@everyone', embeds: [embed] }).catch(() => {});
        return interaction.reply({ content: '✅ Talebin iletildi.', ephemeral: true });
    }
};
