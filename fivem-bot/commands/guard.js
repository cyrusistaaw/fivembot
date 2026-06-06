const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { get: getSetting } = require('../lib/settings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guard')
        .setDescription('Beyaz listeyi yönetir.')
        .addSubcommand(sub =>
            sub
                .setName('ekle')
                .setDescription('Listeye yeni birini ekler.')
                .addUserOption(opt => opt.setName('kisi').setDescription('Eklenecek kişi').setRequired(true))
        )
        .addSubcommand(sub =>
            sub
                .setName('cikar')
                .setDescription('Listeden birini çıkarır.')
                .addUserOption(opt => opt.setName('kisi').setDescription('Çıkarılacak kişi').setRequired(true))
        )
        .addSubcommand(sub => sub.setName('liste').setDescription('Listeyi gösterir.'))
        // Komut menüsünde bile sadece admin görsün (runtime check'e ek güvenlik)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.guild || !interaction.member) {
            return interaction.reply({ content: '❌ Bu komut sadece sunucuda kullanılabilir.', ephemeral: true });
        }

        const guardRolId = getSetting('GUARD_YETKILI_ROL');
        const hasRole = guardRolId ? interaction.member.roles.cache.has(guardRolId) : false;
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ Yetkin yok.', ephemeral: true });
        }

        const guardsPath = path.join(__dirname, '../guards.json');
        try {
            if (!fs.existsSync(guardsPath)) fs.writeFileSync(guardsPath, JSON.stringify({ whitelist: [] }, null, 2));
        } catch (err) {
            console.error('guards.json oluşturma hatası:', err);
            return interaction.reply({ content: '❌ guards.json oluşturulamadı (dosya izni?).', ephemeral: true });
        }

        let guardsData = { whitelist: [] };
        try {
            const raw = fs.readFileSync(guardsPath, 'utf8');
            guardsData = raw.trim() ? JSON.parse(raw) : { whitelist: [] };
        } catch {
            guardsData = { whitelist: [] };
        }
        if (!Array.isArray(guardsData.whitelist)) guardsData.whitelist = [];

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('kisi');

        if (sub === 'ekle') {
            if (!guardsData.whitelist.includes(user.id)) {
                guardsData.whitelist.push(user.id);
                try {
                    fs.writeFileSync(guardsPath, JSON.stringify(guardsData, null, 2));
                } catch (err) {
                    console.error('guards.json yazma hatası:', err);
                    return interaction.reply({ content: '❌ guards.json yazılamadı (dosya izni?).', ephemeral: true });
                }
                return interaction.reply({ content: `✅ **${user.username}** artık bot ekleyebilir.`, ephemeral: true });
            }
            return interaction.reply({ content: 'ℹ️ Bu kişi zaten listede.', ephemeral: true });
        }

        if (sub === 'cikar') {
            if (!guardsData.whitelist.includes(user.id)) {
                return interaction.reply({ content: 'ℹ️ Bu kişi listede yok.', ephemeral: true });
            }
            guardsData.whitelist = guardsData.whitelist.filter(id => id !== user.id);
            try {
                fs.writeFileSync(guardsPath, JSON.stringify(guardsData, null, 2));
            } catch (err) {
                console.error('guards.json yazma hatası:', err);
                return interaction.reply({ content: '❌ guards.json yazılamadı (dosya izni?).', ephemeral: true });
            }
            return interaction.reply({ content: `✅ **${user.username}** listeden çıkarıldı.`, ephemeral: true });
        }

        const list = guardsData.whitelist.length
            ? guardsData.whitelist.map(id => `<@${id}> (\`${id}\`)`).join('\n')
            : 'Liste boş.';

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Guard Beyaz Liste')
            .setDescription(list)
            .setColor('#0099ff')
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
