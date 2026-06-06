const { EmbedBuilder } = require('discord.js');
const { get: getSetting } = require('../lib/settings');

module.exports = {
    name: 'interactionCreate', // Bu event adıdır
    async execute(interaction, client) {
        // Sadece butonsa ve ID 'kayit_btn' ise devam et
        if (!interaction.isButton() || interaction.customId !== 'kayit_btn') return;

        try {
            // 1. ANINDA CEVAP: Discord'a "işlem başladı" diyoruz (Etkileşim Başarısız hatasını bitirir)
            await interaction.deferReply({ ephemeral: true });

            // 2. LOG KANALINA GÖNDERİM
            const kanalId = getSetting('KAYIT_LOG');
            const kanal = kanalId ? await client.channels.fetch(kanalId).catch(() => null) : null;
            if (kanal) {
                const embed = new EmbedBuilder()
                    .setTitle('⚔️ Yeni Kayıt Başvurusu!')
                    .setDescription('Bir kullanıcı kayıt butonuna bastı.')
                    .setColor('#f1c40f')
                    .addFields(
                        { name: '👤 Kullanıcı', value: `${interaction.user.tag}`, inline: true },
                        { name: '🆔 ID', value: `\`${interaction.user.id}\``, inline: true }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                await kanal.send({ content: "@everyone", embeds: [embed] }).catch(err => console.log("Log kanalına mesaj gönderilemedi."));
            }

            // 3. KULLANICIYA SONUÇ
            await interaction.editReply({ content: '✅ Başvurunuz başarıyla yetkililere iletildi. Lütfen bekleyin.' });

        } catch (error) {
            console.error('Kayıt Sistemi Hatası:', error);
            // Eğer daha önce cevap verilmediyse hata mesajı gönder
            if (interaction.deferred) {
                await interaction.editReply({ content: '❌ Bir hata oluştu, lütfen tekrar deneyin.' });
            }
        }
    }
};
