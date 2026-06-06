const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { dbPath } = require('../lib/db');
const { settingsPath, all: allSettings } = require('../lib/settings');
const pkg = require('../package.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Event/DB/ayar durumunu gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const events = interaction.client._debugEvents;
        const loaded = events?.loadedEvents?.length ?? 0;
        const fired = events?.firedEvents?.size ?? 0;
        const debugEvents = process.env.DEBUG_EVENTS === '1';

        const intents = interaction.client.options.intents;
        const intentsValue = typeof intents?.bitfield === 'number' ? intents.bitfield : (Number(intents) || 0);

        const loadedNames = (events?.loadedEvents || []).map(e => e.name);
        const loadedFiles = (events?.loadedEvents || []).map(e => `${e.name}:${e.file}`);
        const firedNames = Array.from(events?.firedEvents || []);

        const shortList = (arr, max = 12) => {
            const sliced = arr.slice(0, max);
            const more = arr.length > max ? ` …(+${arr.length - max})` : '';
            return (sliced.join(', ') || 'Yok') + more;
        };

        let diskEvents = [];
        try {
            const eventsDir = path.join(__dirname, '..', 'events');
            diskEvents = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));
        } catch {}

        const dbDir = path.dirname(dbPath);
        let canWrite = false;
        try {
            fs.accessSync(dbDir, fs.constants.W_OK);
            canWrite = true;
        } catch {}

        let dbExists = false;
        let dbSize = 0;
        try {
            dbExists = fs.existsSync(dbPath);
            if (dbExists) dbSize = fs.statSync(dbPath).size;
        } catch {}

        const settings = allSettings();
        const critical = ['GUILD_ID', 'ERROR_LOG', 'OTO_ROL_ID', 'KANAL_TARIKH', 'KANAL_AKTIF', 'KANAL_TOPLAM', 'GIRIS_CIKIS', 'TICKET_LOG', 'TICKET_KATEGORI_ID', 'TICKET_YETKILI_ROL'];
        const criticalText = critical.map(k => `${k}=${settings[k] ?? 'Yok'}`).join(' | ');

        return interaction.reply({
            content:
                `🧪 Debug\n` +
                `Version: ${pkg.version}\n` +
                `Events: loaded=${loaded} firedOnce=${fired} DEBUG_EVENTS=${debugEvents}\n` +
                `Intents(bitfield): ${intentsValue}\n` +
                `Loaded: ${shortList(loadedNames)}\n` +
                `LoadedFiles: ${shortList(loadedFiles)}\n` +
                `DiskEvents: ${shortList(diskEvents)}\n` +
                `Fired: ${shortList(firedNames)}\n` +
                `DB: path=${dbPath} exists=${dbExists} size=${dbSize} writableDir=${canWrite}\n` +
                `Settings: ${criticalText}\n` +
                `settings.json: ${settingsPath}\n` +
                `cwd: ${process.cwd()}`,
            ephemeral: true
        });
    }
};
