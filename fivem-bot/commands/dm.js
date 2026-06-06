const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Belirli bir roldeki herkese şık bir duyuru gönderir.')
        .addRoleOption(opt => opt.setName('rol').setDescription('Mesajın gideceği rolü seçin.').setRequired(true))
        .addStringOption(opt => opt.setName('mesaj').setDescription('Gönderilecek duyuru metnini yazın.').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ Bu komut sadece sunucuda kullanılabilir.', ephemeral: true });
        }

        const secilenRol = interaction.options.getRole('rol');
        const duyuruMesaji = interaction.options.getString('mesaj');

        await interaction.reply({ content: `🚀 **${secilenRol.name}** rolü için duyuru gönderimi başlatıldı...`, ephemeral: true });

        const dmEmbed = new EmbedBuilder()
            .setTitle('📢 Eternal Family Duyurusu')
            .setDescription(duyuruMesaji)
            .setColor('#8b0000')
            .setFooter({ text: 'Eternal Family Yönetim', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.guild.members.fetch();
        const uyeler = interaction.guild.members.cache.filter(m => m.roles.cache.has(secilenRol.id) && !m.user.bot);
        
        let basarili = 0;
        for (const [id, member] of uyeler) {
            try {
                await member.send({ embeds: [dmEmbed] });
                basarili++;
            } catch (e) {
                console.log(`${member.user.tag} kullanıcısına DM gönderilemedi.`);
            }
        }

        await interaction.followUp({ content: `✅ İşlem tamamlandı! **${basarili}** üyeye duyuru ulaştırıldı.`, ephemeral: true });
    }
};
