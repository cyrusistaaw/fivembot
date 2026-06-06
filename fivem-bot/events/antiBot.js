const { EmbedBuilder, AuditLogEvent, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { get: getSetting } = require('../lib/settings');

module.exports = {
    name: Events.GuildMemberAdd, // Doğrudan event ismini veriyoruz
    async execute(member) {
        // Eğer katılan bir bot değilse işlem yapma
        if (!member.user.bot) return;

        const guardsPath = path.join(__dirname, '../guards.json');
        
        // Whitelist dosyasını kontrol et
        if (!fs.existsSync(guardsPath)) {
            console.error("⚠️ guards.json dosyası bulunamadı! Bot koruması çalışmayabilir.");
            return;
        }

        try {
            const guardsData = JSON.parse(fs.readFileSync(guardsPath, 'utf8'));

            // Botu kimin eklediğini Denetim Kayıtlarından (Audit Logs) çek
            // Biraz beklemek gerekebilir çünkü loglar bazen geç düşer
            await new Promise(resolve => setTimeout(resolve, 2000)); 

            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.BotAdd,
            }).catch(() => null);

            if (!fetchedLogs) return;
            const botLog = fetchedLogs.entries.first();
            
            // Eğer log bulunamadıysa veya log çok eskiyse (5 saniyeden eski) dur
            if (!botLog || (Date.now() - botLog.createdTimestamp > 5000)) return;

            const { executor, target } = botLog;

            // Eğer ekleyen kişi whitelist (beyaz liste) içinde YOKSA
            const whitelist = Array.isArray(guardsData.whitelist) ? guardsData.whitelist : [];
            if (!whitelist.includes(executor.id)) {
                
                // 1. Botu Yasakla
                await member.guild.members.ban(target.id, { reason: "Guard: İzinsiz Bot" }).catch(() => {});
                
                // 2. Botu Sokan Kişiyi Yasakla
                await member.guild.members.ban(executor.id, { reason: "Guard: İzinsiz Bot Ekleme" }).catch(() => {});

                // Log Kanalına Bildir
                const logKanalId = getSetting('GUARD_LOG') || getSetting('BAN_LOG');
                const logKanal = logKanalId ? await member.client.channels.fetch(logKanalId).catch(() => null) : null;
                
                if (logKanal) {
                    const embed = new EmbedBuilder()
                        .setTitle('🛡️ Guard Sistemi: İzinsiz Bot Engellendi')
                        .setColor('#ff0000')
                        .addFields(
                            { name: '🚫 Engellenen Bot', value: `\`${target.tag}\` (${target.id})`, inline: false },
                            { name: '👤 Sokan Kişi (Banlandı)', value: `<@${executor.id}> (\`${executor.tag}\`)`, inline: false },
                            { name: '📝 Sebep', value: 'Beyaz listede bulunmayan kullanıcı tarafından bot ekleme girişimi.', inline: false }
                        )
                        .setFooter({ text: 'Eternal Family Koruma Sistemi' })
                        .setTimestamp();
                    
                    logKanal.send({ content: "@everyone", embeds: [embed] });
                }
                
                console.log(`🛡️ [GUARD] ${executor.tag} tarafından sokulan ${target.tag} engellendi ve ikisi de banlandı.`);
            }
        } catch (error) {
            console.error('AntiBot sisteminde bir hata oluştu:', error);
        }
    }
};
