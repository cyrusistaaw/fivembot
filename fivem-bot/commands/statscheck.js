const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { get: getSetting } = require('../lib/settings');

const fmt = (v) => (v == null ? 'Yok' : String(v));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('statscheck')
        .setDescription('Tarih/Aktif/Toplam kanalı için yetki ve güncelleme testi yapar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ Bu komut sadece sunucuda kullanılabilir.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true }).catch(() => {});

        const guild = interaction.guild;
        const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
        if (!me) return interaction.reply({ content: '❌ Bot member bilgisi alınamadı.', ephemeral: true });

        const ids = {
            KANAL_TARIKH: getSetting('KANAL_TARIKH'),
            KANAL_AKTIF: getSetting('KANAL_AKTIF'),
            KANAL_TOPLAM: getSetting('KANAL_TOPLAM')
        };

        const now = new Date();
        const trTarih = new Intl.DateTimeFormat('tr-TR', {
            timeZone: 'Europe/Istanbul',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(now);

        const expected = {
            KANAL_TARIKH: `📅 Tarih: ${trTarih}`,
            KANAL_AKTIF: `🟢 Aktif: (hesaplanır)`,
            KANAL_TOPLAM: `⚔️ Toplam: ${guild.memberCount}`
        };

        const results = [];

        for (const key of Object.keys(ids)) {
            const id = ids[key];
            if (!id) {
                results.push(`- ${key}: ❌ ID yok`);
                continue;
            }

            const channel = await interaction.client.channels.fetch(id).catch(() => null);
            if (!channel || channel.guildId !== guild.id) {
                results.push(`- ${key}: ❌ Kanal bulunamadı / başka sunucu (id=${id})`);
                continue;
            }

            if (!('setName' in channel)) {
                results.push(`- ${key}: ❌ setName desteklenmiyor (type=${channel.type})`);
                continue;
            }

            const perms = channel.permissionsFor(me);
            const canManage = perms?.has(PermissionFlagsBits.ManageChannels) ?? false;
            const canView = perms?.has(PermissionFlagsBits.ViewChannel) ?? false;

            let base = `- ${key}: ok id=${id} name="${channel.name}" view=${canView} manage=${canManage}`;

            if (!canView) {
                results.push(`${base} ❌ (ViewChannel yok)`);
                continue;
            }

            if (!canManage) {
                results.push(`${base} ❌ (ManageChannels yok)`);
                continue;
            }

            // Aktif kanalı ismi presence'e bağlı; burada sadece setName yetkisini test etmek için noop değişiklik yapmayalım.
            if (key === 'KANAL_AKTIF') {
                results.push(`${base} ✅ (yetki var; aktif sayımı presence intent'e bağlı olabilir)`);
                continue;
            }

            const newName = expected[key];
            try {
                await channel.setName(newName);
                results.push(`${base} ✅ setName -> "${newName}"`);
            } catch (err) {
                results.push(`${base} ❌ setName hata: ${fmt(err?.code)} ${fmt(err?.message || err)}`);
            }
        }

        return interaction.editReply({
            content: `🧪 StatsCheck\n${results.join('\n')}`.slice(0, 1900),
        }).catch(() => {});
    }
};
