const { get: getSetting } = require('../lib/settings');
const { sendErrorLog } = require('../lib/errorLog');

const EMOJI_DATE = '\uD83D\uDCC5'; // 📅
const EMOJI_ACTIVE = '\uD83D\uDFE2'; // 🟢
const EMOJI_TOTAL = '\u2694\uFE0F'; // ⚔️

module.exports = {
    name: 'ready',
    async execute(client) {
        console.log(`✅ ${client.user.tag} paneli izlemeye başladı!`);

        const guildId = getSetting('GUILD_ID');
        let firstRun = true;

        const getChannel = async (guild, channelId) => {
            if (!channelId) return null;
            return (
                guild.channels?.cache?.get(channelId) ||
                client.channels.cache.get(channelId) ||
                await client.channels.fetch(channelId).catch(() => null)
            );
        };

        const setNameSafe = async (channel, name, label) => {
            try {
                if (!channel) return;
                if (channel.name === name) return;
                await channel.setName(name);
            } catch (err) {
                const msg = `${label} setName başarısız: ${err?.code || ''} ${err?.message || err}`;
                console.log(`⚠️ ${msg}`);
                await sendErrorLog(client, msg);
            }
        };

        const panelGuncelle = async () => {
            const guild =
                (guildId && client.guilds.cache.get(guildId)) ||
                (guildId ? await client.guilds.fetch(guildId).catch(() => null) : null) ||
                client.guilds.cache.first();
            if (!guild) return;

            if (firstRun) {
                console.log(`[STATS] Guild: ${guild.name} (${guild.id})`);
                console.log(`[STATS] IDs: TARIKH=${getSetting('KANAL_TARIKH')} AKTIF=${getSetting('KANAL_AKTIF')} TOPLAM=${getSetting('KANAL_TOPLAM')}`);

                try {
                    const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
                    if (!me) {
                        console.log('⚠️ [STATS] Bot üye bilgisi alınamadı.');
                    } else if (!me.permissions.has('ManageChannels')) {
                        const msg = 'Botta Manage Channels izni yok; stats kanalları yeniden adlandırılamaz.';
                        console.log(`⚠️ [STATS] ${msg}`);
                        await sendErrorLog(client, msg);
                    } else {
                        console.log('✅ [STATS] Manage Channels izni var.');
                    }
                } catch {}
            }

            // Tarih
            try {
                const tarihKanalId = getSetting('KANAL_TARIKH');
                const tarihKanal = await getChannel(guild, tarihKanalId);
                if (firstRun && !tarihKanal) console.log(`⚠️ Tarih kanalı bulunamadı: ${tarihKanalId}`);

                const simdi = new Date();
                const trTarih = new Intl.DateTimeFormat('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).format(simdi);

                await setNameSafe(tarihKanal, `${EMOJI_DATE} Tarih: ${trTarih}`, 'Tarih');
            } catch (err) {
                await sendErrorLog(client, err?.stack || err?.message || err);
            }

            // Üye fetch (presence intent kapalıysa patlayabilir)
            try {
                await guild.members.fetch({ withPresences: true }).catch(() => null);
            } catch {}

            // Aktif + Toplam
            try {
                const aktifKanalId = getSetting('KANAL_AKTIF');
                const aktifKanal = await getChannel(guild, aktifKanalId);
                if (firstRun && !aktifKanal) console.log(`⚠️ Aktif kanalı bulunamadı: ${aktifKanalId}`);

                const aktifSayisi = guild.members.cache.filter(m =>
                    !m.user.bot &&
                    m.presence &&
                    (m.presence.status !== 'offline' && m.presence.status !== 'invisible')
                ).size;
                await setNameSafe(aktifKanal, `${EMOJI_ACTIVE} Aktif: ${aktifSayisi}`, 'Aktif');

                const toplamKanalId = getSetting('KANAL_TOPLAM');
                const toplamKanal = await getChannel(guild, toplamKanalId);
                if (firstRun && !toplamKanal) console.log(`⚠️ Toplam kanalı bulunamadı: ${toplamKanalId}`);

                await setNameSafe(toplamKanal, `${EMOJI_TOTAL} Toplam: ${guild.memberCount}`, 'Toplam');
            } catch (err) {
                await sendErrorLog(client, err?.stack || err?.message || err);
            }

            firstRun = false;
        };

        panelGuncelle().catch(() => {});
        setTimeout(panelGuncelle, 10000);
        setInterval(panelGuncelle, 300000);
    }
};
