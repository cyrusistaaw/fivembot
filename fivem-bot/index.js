const { Client, GatewayIntentBits, Collection, Partials, ActivityType, REST, Routes } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const { get: getSetting } = require('./lib/settings');
const pkg = require('./package.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember]
});

client.commands = new Collection();

const loadedEvents = [];
const firedEvents = new Set();
const DEBUG_EVENTS = process.env.DEBUG_EVENTS === '1';
client._debugEvents = { loadedEvents, firedEvents };

const sendErrorLog = async (text) => {
    try {
        const channelId = getSetting('ERROR_LOG') || getSetting('GIRIS_CIKIS');
        if (!channelId || !client.isReady()) return;
        const ch = await client.channels.fetch(channelId).catch(() => null);
        if (!ch) return;
        const msg = String(text || '').slice(0, 1800);
        ch.send({ content: `\uD83E\uDDEF Bot Hatası\n\`\`\`\n${msg}\n\`\`\`` }).catch(() => {});
    } catch {}
};

process.on('unhandledRejection', (reason) => {
    console.error('UnhandledRejection:', reason);
    sendErrorLog(reason?.stack || reason?.message || reason);
});

process.on('uncaughtException', (err) => {
    console.error('UncaughtException:', err);
    sendErrorLog(err?.stack || err?.message || err);
});

// Komut + event loader
for (const folder of ['commands', 'events']) {
    const folderPath = path.join(__dirname, folder);
    if (!fs.existsSync(folderPath)) continue;

    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of files) {
        const item = require(path.join(folderPath, file));

        if (folder === 'commands') {
            if (!item?.data?.name || typeof item.execute !== 'function') {
                console.log(`[SKIP] command file=${file} (geçersiz export)`);
                continue;
            }
            client.commands.set(item.data.name, item);
            continue;
        }

        if (!item?.name || typeof item.execute !== 'function') {
            console.log(`[SKIP] event file=${file} (geçersiz export)`);
            continue;
        }

        loadedEvents.push({ name: item.name, file, once: !!item.once });
        if (DEBUG_EVENTS) console.log(`[LOAD] event=${item.name} once=${!!item.once} file=${file}`);

        const handler = async (...args) => {
            try {
                const first = !firedEvents.has(item.name);
                firedEvents.add(item.name);
                if (DEBUG_EVENTS && first) console.log(`[FIRE] event=${item.name} file=${file}`);
                await item.execute(...args, client);
            } catch (err) {
                console.error(`[EVENT] ${item.name} file=${file} hata:`, err);
                sendErrorLog(err?.stack || err?.message || err);
            }
        };

        if (item.once) client.once(item.name, handler);
        else client.on(item.name, handler);
    }
}

console.log(`[BOOT] v=${pkg.version} commands=${client.commands.size} events=${loadedEvents.length} cwd=${process.cwd()}`);
if (DEBUG_EVENTS) console.log(`[BOOT] eventFiles=${loadedEvents.map(e => e.file).join(', ')}`);

const registerSlashCommands = async () => {
    const guildId = getSetting('GUILD_ID') || config.GUILD_ID;
    const token = getSetting('TOKEN') || config.token;

    if (!guildId) return console.log('[KOMUT] GUILD_ID yok, slash komutlar kaydedilmedi.');
    if (!token) return console.log('[KOMUT] TOKEN yok, slash komutlar kaydedilmedi.');

    const commandsJson = client.commands.map(cmd => cmd.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(token);

    try {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commandsJson });
        console.log(`[KOMUT] ${commandsJson.length} slash komut kaydedildi. (Guild: ${guildId})`);
    } catch (err) {
        console.error('[KOMUT] Slash komut kayıt hatası:', err);
        sendErrorLog(err?.stack || err?.message || err);
    }
};

const joinVoice = async () => {
    const guildId = getSetting('GUILD_ID') || config.GUILD_ID;
    const channelId = getSetting('BOT_SES_KANAL_ID') || config.BOT_SES_KANAL_ID;
    if (!guildId || !channelId) return;

    try {
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return;

        const channel = guild.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null);
        if (!channel) return;

        const oldConnection = getVoiceConnection(guild.id);
        if (oldConnection) oldConnection.destroy();

        joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false,
            group: client.user.id
        });

        console.log(`[SES] "${channel.name}" kanalına giriş yapıldı.`);
    } catch (err) {
        console.error('[SES] Hata:', err?.message || err);
        sendErrorLog(err?.stack || err?.message || err);
    }
};

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} aktif!`);

    client.user.setPresence({
        activities: [{
            name: 'Developed By Cyrus',
            type: ActivityType.Streaming,
            url: 'https://www.twitch.tv/cyrusfix'
        }],
        status: 'dnd',
    });

    await registerSlashCommands();
    setTimeout(joinVoice, 5000);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(`[CMD] ${interaction.commandName} hata:`, err);
        sendErrorLog(err?.stack || err?.message || err);

        try {
            if (interaction.deferred) {
                await interaction.editReply({ content: '❌ Bir hata oluştu.' }).catch(() => {});
            } else if (!interaction.replied) {
                await interaction.reply({ content: '❌ Bir hata oluştu.', ephemeral: true }).catch(() => {});
            } else {
                await interaction.followUp({ content: '❌ Bir hata oluştu.', ephemeral: true }).catch(() => {});
            }
        } catch {}
    }
});

const token = getSetting('TOKEN') || config.token;
if (!token) {
    console.error("❌ TOKEN bulunamadı. Railway Variables'a TOKEN ekleyin.");
} else {
    client.login(token);
}
