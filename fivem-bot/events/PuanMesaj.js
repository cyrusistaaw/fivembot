const { withDb, normalizeUser } = require('../lib/db');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (!message?.guild) return;
        if (message.author?.bot) return;

        const userId = message.author.id;

        await withDb((db) => {
            const user = normalizeUser(db[userId], message.author.username);

            user.messageCount += 1;
            user.msgCounter = (user.msgCounter || 0) + 1;
            user.username = message.author.username;

            if (user.msgCounter >= 10) {
                user.puan += 1;
                user.msgCounter = 0;
                console.log(`[PUAN] ${user.username} 10 mesajı geçti, 1 puan kazandı.`);
            }

            db[userId] = user;
        });
    }
};
