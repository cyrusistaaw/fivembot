const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('puantablosu')
        .setDescription('Aktiflik ve puan durumunu gösterir.')
        .addUserOption(option =>
            option
                .setName('kullanici')
                .setDescription('Profiline bakmak istediğiniz üyeyi seçin.')
                .setRequired(false)
        ),

    async execute(interaction) {
        const target = interaction.options.getUser('kullanici') || interaction.user;
        const dbPath = path.join(__dirname, '../database.json');

        try {
            if (!fs.existsSync(dbPath)) {
                return interaction.reply({ content: '❌ Veritabanı henüz oluşturulmamış.', ephemeral: true });
            }

            const raw = fs.readFileSync(dbPath, 'utf8');
            const db = raw.trim() ? JSON.parse(raw) : {};
            const userData = db[target.id];

            let puan = 0;
            let sesDakika = 0;
            let mesajSayisi = 0;

            if (userData) {
                if (typeof userData === 'object') {
                    puan = userData.puan || 0;
                    sesDakika = userData.voiceTime || 0;
                    mesajSayisi = userData.messageCount || 0;
                } else {
                    puan = userData || 0;
                }
            }

            const saat = Math.floor(sesDakika / 60);
            const dakika = sesDakika % 60;
            const sesFormati = saat > 0 ? `${saat}s ${dakika}dk` : `${dakika}dk`;

            const embed = new EmbedBuilder()
                .setTitle('🛡️ Eternal Family | Üye Profili')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setColor('#34495e')
                .addFields(
                    { name: '👤 Kullanıcı', value: `${target.tag}`, inline: true },
                    { name: '💰 Mevcut Puan', value: `\`${puan} Puan\``, inline: true },
                    {
                        name: '📊 İstatistikler',
                        value: `💬 **${mesajSayisi}** Mesaj\n🔊 **${sesFormati}** Ses`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Eternal Family Aktiflik Sistemi' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Puan tablosu hatası:', error);
            await interaction.reply({ content: '❌ Veriler okunurken bir hata oluştu.', ephemeral: true });
        }
    }
};
