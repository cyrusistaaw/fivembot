const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sil')
        .setDescription('Belirtilen miktarda mesajı temizler.')
        .addIntegerOption(opt => opt.setName('miktar').setDescription('1-100 arası bir sayı girin.').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        if (!interaction.guild || !interaction.channel) {
            return interaction.reply({ content: '❌ Bu komut sadece sunucuda kullanılabilir.', ephemeral: true });
        }
        const miktar = interaction.options.getInteger('miktar');

        if (miktar < 1 || miktar > 100) {
            return interaction.reply({ content: '❌ Lütfen 1 ile 100 arasında bir sayı girin.', ephemeral: true });
        }

        await interaction.channel.bulkDelete(miktar, true).then(messages => {
            const embed = new EmbedBuilder()
                .setDescription(`🧹 **${messages.size}** adet mesaj başarıyla süpürüldü.`)
                .setColor('#95a5a6');
            
            interaction.reply({ embeds: [embed], ephemeral: true });
        }).catch(err => {
            console.error(err);
            interaction.reply({ content: '❌ Mesajlar silinirken bir hata oluştu (14 günden eski mesajlar toplu silinemez).', ephemeral: true });
        });
    }
};
