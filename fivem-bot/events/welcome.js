const { EmbedBuilder, Events } = require('discord.js');
const { get: getSetting } = require('../lib/settings');
const { sendErrorLog } = require('../lib/errorLog');

module.exports = {
    name: Events.GuildMemberAdd, 
    async execute(member) {
        // Botları koruma sistemi (antiBot) zaten hallettiği için burada işlem yapmıyoruz
        if (member.user.bot) return;

        const logKanalId = getSetting('GIRIS_CIKIS');
        const logKanal = logKanalId ? await member.client.channels.fetch(logKanalId).catch(() => null) : null;

        try {
            // --- 1. SADECE TEMEL ROLÜ VERME (OTO_ROL) ---
            // AILE_ROL_ID'yi buradan kaldırdık ki adam kayıt olmadan o yetkiyi almasın.
            const otoRolId = getSetting('OTO_ROL_ID');
            
            if (otoRolId && otoRolId.length > 5) {
                try {
                    const me = member.guild.members.me || await member.guild.members.fetchMe().catch(() => null);
                    const role = member.guild.roles.cache.get(otoRolId) || await member.guild.roles.fetch(otoRolId).catch(() => null);

                    if (!me) {
                        const msg = 'Bot üye bilgisi alınamadı; oto-rol verilemedi.';
                        console.log(`⚠️ ${msg}`);
                        await sendErrorLog(member.client, msg);
                    } else if (!me.permissions.has('ManageRoles')) {
                        const msg = 'Botta Manage Roles izni yok; oto-rol verilemez.';
                        console.log(`⚠️ ${msg}`);
                        await sendErrorLog(member.client, msg);
                    } else if (!role) {
                        const msg = `OTO_ROL_ID rolü bulunamadı: ${otoRolId}`;
                        console.log(`⚠️ ${msg}`);
                        await sendErrorLog(member.client, msg);
                    } else if (me.roles.highest.position <= role.position) {
                        const msg = `Rol hiyerarşisi yetersiz: botRolePos=${me.roles.highest.position} hedefRolePos=${role.position}`;
                        console.log(`⚠️ ${msg}`);
                        await sendErrorLog(member.client, msg);
                    }
                    await member.roles.add(otoRolId);
                } catch (err) {
                    const msg = `Oto-rol verilemedi (OTO_ROL_ID=${otoRolId}): ${err?.code || ''} ${err?.message || err}`;
                    console.log(`⚠️ ${msg}`);
                    await sendErrorLog(member.client, msg);
                }
            }

            // --- 2. LOG VE HOŞ GELDİN MESAJLARI ---
            if (logKanal) {
                // A) YETKİLİLERE ÖZEL BİLDİRİM (Etiketsiz/Ever'sız)
                const basvuruEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Yeni bir üye katıldı!', iconURL: member.guild.iconURL() })
                    .setTitle('⚔️ Aileye Yeni Katılım')
                    .addFields(
                        { name: 'Kullanıcı', value: `${member} (${member.user.username})`, inline: true },
                        { name: 'Hesap ID', value: `\`${member.id}\``, inline: true }
                    )
                    .setColor('#f1c40f')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setFooter({ text: `Katılım Saati: ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` });

                // Burada content kısmından @everyone'ı sildim.
                await logKanal.send({ embeds: [basvuruEmbed] }).catch(async (err) => {
                    await sendErrorLog(member.client, `Giriş/çıkış log gönderilemedi: ${err?.code || ''} ${err?.message || err}`);
                });

                // B) GENEL HOŞ GELDİN MESAJI
                const hgEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Hoş Geldin!', iconURL: member.user.displayAvatarURL() })
                    .setDescription(`👋 **${member.user.username}** sunucumuza katıldı.\n\n> Aramıza hoş geldin! Seninle birlikte **${member.guild.memberCount}** kişi olduk.`)
                    .setColor('#2ecc71')
                    .setTimestamp();

                await logKanal.send({ embeds: [hgEmbed] }).catch(async (err) => {
                    await sendErrorLog(member.client, `Hoşgeldin embed gönderilemedi: ${err?.code || ''} ${err?.message || err}`);
                });
            }

            // --- 3. KULLANICIYA ÖZEL DM MESAJI ---
            try {
                await member.send(`Merhaba **${member.user.username}**, **Eternal Family** sunucusuna hoş geldin! Kayıt olmak için yetkililerimizi bekleyebilirsin. 🛡️`);
            } catch (e) {
                // DM kapalıysa hata vermesin
            }

        } catch (error) {
            console.error('Welcome sistemi hatası:', error);
        }
    }
};
