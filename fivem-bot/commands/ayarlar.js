const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { get: getSetting, set: setSetting, all: allSettings, settingsPath } = require('../lib/settings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ayarlar')
        .setDescription('Bot ayarlarını yönetir.')
        .addSubcommand(sub =>
            sub
                .setName('set')
                .setDescription('Bir ayarı kaydeder.')
                .addStringOption(o => o.setName('key').setDescription('Örn: KANAL_TARIKH').setRequired(true))
                .addStringOption(o => o.setName('value').setDescription('ID/değer').setRequired(true))
        )
        .addSubcommand(sub =>
            sub
                .setName('get')
                .setDescription('Bir ayarı gösterir.')
                .addStringOption(o => o.setName('key').setDescription('Örn: KANAL_TARIKH').setRequired(true))
        )
        .addSubcommand(sub => sub.setName('list').setDescription('Tüm ayarları listeler.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'set') {
            const key = interaction.options.getString('key');
            const value = interaction.options.getString('value');
            setSetting(key, value);
            return interaction.reply({ content: `✅ Kaydedildi: \`${key}\` = \`${value}\` (dosya: ${settingsPath})`, ephemeral: true });
        }

        if (sub === 'get') {
            const key = interaction.options.getString('key');
            const val = getSetting(key);
            return interaction.reply({ content: `🔧 \`${key}\` = \`${val ?? 'Yok'}\``, ephemeral: true });
        }

        const data = allSettings();
        const embed = new EmbedBuilder()
            .setTitle('🔧 Ayarlar')
            .setColor('#2b2d31')
            .setDescription(Object.keys(data).sort().map(k => `\`${k}\` = \`${String(data[k])}\``).join('\n').slice(0, 3900))
            .setFooter({ text: `Kaynak: config.json + settings.json (+ env override)` });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
