const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_JSON_PATH
    ? path.resolve(process.env.DB_JSON_PATH)
    : path.join(__dirname, '..', 'database.json');

let queue = Promise.resolve();

const readDb = () => {
    if (!fs.existsSync(dbPath)) return {};
    const raw = fs.readFileSync(dbPath, 'utf8');
    if (!raw.trim()) return {};
    return JSON.parse(raw);
};

const writeDb = (db) => {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));
};

const normalizeUser = (existing, usernameFallback) => {
    if (!existing) {
        return {
            username: usernameFallback || 'Bilinmiyor',
            puan: 0,
            voiceTime: 0,
            messageCount: 0,
            voicePuanBank: 0,
            msgCounter: 0,
            dailyLast: 0
        };
    }

    if (typeof existing !== 'object') {
        return {
            username: usernameFallback || 'Bilinmiyor',
            puan: Number(existing) || 0,
            voiceTime: 0,
            messageCount: 0,
            voicePuanBank: 0,
            msgCounter: 0,
            dailyLast: 0
        };
    }

    return {
        username: existing.username || usernameFallback || 'Bilinmiyor',
        puan: Number(existing.puan) || 0,
        voiceTime: Number(existing.voiceTime) || 0,
        messageCount: Number(existing.messageCount) || 0,
        voicePuanBank: Number(existing.voicePuanBank) || 0,
        msgCounter: Number(existing.msgCounter) || 0,
        dailyLast: Number(existing.dailyLast) || 0
    };
};

const withDb = (fn) => {
    queue = queue.then(() => {
        const db = readDb();
        const result = fn(db);
        writeDb(db);
        return result;
    }).catch((err) => {
        console.error('DB update hatası:', err);
    });

    return queue;
};

module.exports = {
    dbPath,
    withDb,
    normalizeUser,
};
