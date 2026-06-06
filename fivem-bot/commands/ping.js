const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Bot gecikmesini ve uptime bilgisini gösterir.'),

    async execute(interaction) {
        const wsPing = interaction.client.ws.ping;
        const uptimeMs = interaction.client.uptime || 0;
        const uptimeMin = Math.floor(uptimeMs / 60000);
        return interaction.reply({ content: `🏓 Pong! WS: **${wsPing}ms** | Uptime: **${uptimeMin} dk**`, ephemeral: true });
    }
};
