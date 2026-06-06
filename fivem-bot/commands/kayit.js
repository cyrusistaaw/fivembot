const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kayit-sistemi')
        .setDescription('Kayıt mesajını ve üye sayısını gönderir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ Bu komut sadece sunucuda kullanılabilir.', ephemeral: true });
        }
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('kayit_btn')
                .setLabel('Aileye Katılmak İstiyorum')
                .setStyle(ButtonStyle.Success)
                .setEmoji('⚔️')
        );

        const embed = new EmbedBuilder()
            .setTitle('⚔️ Eternal Family Kayıt Merkezi')
            .setDescription(`Aramıza hoş geldiniz! Başvuru yapmak için butona basın.\n\n📊 **Üye Sayısı:** \`${interaction.guild.memberCount}\``)
            .setColor('#8b0000');

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
