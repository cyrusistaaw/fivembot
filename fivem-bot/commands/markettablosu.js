const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('markettablosu')
        .setDescription('Puan marketindeki ürünleri ve fiyatları listeler.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('💎 ETERNAL FAMILY - PUAN MARKETİ')
            .setDescription('Kazandığın puanları burada lüks harcamalara dönüştürebilirsin.')
            .setColor('#f39c12')
            .addFields(
                { name: '⚔️ SİLAH PAKETİ', value: '└ `50 Puan` \n*Çatışmalar için temel mühimmat sağlar.*', inline: false },
                { name: '🎖️ ÖZEL BAĞIŞÇI ROLÜ', value: '└ `200 Puan` \n*1 Hafta boyunca listede en üstte görünürsün.*', inline: false },
                { name: '🏎️ AİLE ÖZEL ARACI', value: '└ `500 Puan` \n*Sana özel tanımlanmış modifiyeli araç.*', inline: false }
            )
            // KESİN ÇALIŞAN LİNK FORMATI (Commit ID olmadan):
            .setImage('https://raw.githubusercontent.com/se631/fivembot/main/fivem-bot/market.png') 
            .setFooter({ text: 'Ürün satın almak için yetkililere başvurun.' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
