const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { get: getSetting } = require('../lib/settings');

const fmt = (v) => (v == null ? 'Yok' : String(v));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('otorolcheck')
        .setDescription('Oto-rol için yetki/hiyerarşi kontrolü yapar (istersen test eder).')
        .addBooleanOption(o =>
            o.setName('test').setDescription('Test amaçlı kendine rol verip geri al').setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ Bu komut sadece sunucuda kullanılabilir.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true }).catch(() => {});

        const guild = interaction.guild;
        const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
        if (!me) return interaction.editReply({ content: '❌ Bot member bilgisi alınamadı.' }).catch(() => {});

        const roleId = getSetting('OTO_ROL_ID');
        if (!roleId) return interaction.editReply({ content: '❌ OTO_ROL_ID ayarlı değil.' }).catch(() => {});

        const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
        if (!role) return interaction.editReply({ content: `❌ Rol bulunamadı: ${roleId}` }).catch(() => {});

        const hasManageRoles = me.permissions.has(PermissionFlagsBits.ManageRoles);
        const hierarchyOk = me.roles.highest.position > role.position;

        const lines = [];
        lines.push(`- OTO_ROL_ID=${roleId} role="${role.name}" pos=${role.position}`);
        lines.push(`- Bot ManageRoles=${hasManageRoles}`);
        lines.push(`- BotRolePos=${me.roles.highest.position} > TargetRolePos=${role.position} => ${hierarchyOk}`);

        if (!hasManageRoles) {
            lines.push(`- ❌ Çözüm: bot rolüne Manage Roles ver`);
        }
        if (!hierarchyOk) {
            lines.push(`- ❌ Çözüm: bot rolünü roller ekranında hedef rolün üstüne taşı`);
        }

        const doTest = interaction.options.getBoolean('test') === true;
        if (doTest) {
            const member = await guild.members.fetch(interaction.user.id).catch(() => null);
            if (!member) {
                lines.push(`- ❌ Test: member fetch olmadı`);
            } else {
                try {
                    await member.roles.add(roleId);
                    await member.roles.remove(roleId);
                    lines.push(`- ✅ Test: rol ver/al başarılı`);
                } catch (err) {
                    lines.push(`- ❌ Test hata: ${fmt(err?.code)} ${fmt(err?.message || err)}`);
                }
            }
        } else {
            lines.push(`- ℹ️ Test yapmak için: /otorolcheck test:true`);
        }

        return interaction.editReply({ content: `🧪 OtoRolCheck\n${lines.join('\n')}`.slice(0, 1900) }).catch(() => {});
    }
};
