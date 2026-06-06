const { withDb, normalizeUser } = require('../lib/db');

const voiceJoinCache = new Map();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const userId = newState.id;

        if (!oldState.channelId && newState.channelId) {
            voiceJoinCache.set(userId, Date.now());
            return;
        }

        if (oldState.channelId && !newState.channelId) {
            const joinTime = voiceJoinCache.get(userId);
            if (!joinTime) return;

            const durationMs = Date.now() - joinTime;
            const minutes = Math.floor(durationMs / 60000);

            voiceJoinCache.delete(userId);
            if (minutes <= 0) return;

            await withDb((db) => {
                const username = newState.member?.user?.username;
                const user = normalizeUser(db[userId], username);

                user.voiceTime += minutes;

                const currentBank = (user.voicePuanBank || 0) + minutes;
                if (currentBank >= 60) {
                    const earnedPuan = Math.floor(currentBank / 60);
                    const remainder = currentBank % 60;
                    user.puan += earnedPuan;
                    user.voicePuanBank = remainder;
                    console.log(`[PUAN] ${user.username} seste ${earnedPuan} puan kazandı.`);
                } else {
                    user.voicePuanBank = currentBank;
                }

                user.username = username || user.username;
                db[userId] = user;
            });
        }
    }
};
