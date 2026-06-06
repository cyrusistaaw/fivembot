const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    EmbedBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Destek talebi oluşturur'),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🎫 Destek Sistemi')
            .setDescription('Destek almak için aşağıdaki butona bas.')
            .setFooter({ text: 'Eternal Family Destek Sistemi' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('🎫 Ticket Oluştur')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
