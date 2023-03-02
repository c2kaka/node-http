const {SESSION_KEY, ONE_WEEK} = require('../constants');

async function getSession(db, ctx, name) {
    const key = ctx.cookie[SESSION_KEY];

    if (key) {
        const now = Date.now();
        const session = await db.get('select * from session where key = ? and name = ? and expires > ?', key, name, now);

        if (session) {
            return JSON.parse(session.value);
        }
    }

    return null;
}

async function setSession(db, ctx, name, data) {
    console.log('setSession', ctx);
    const key = ctx.cookie[SESSION_KEY];

    if (!key) {
        throw new Error('invalid session key');
    }

    try {
        let result = await db.get('select * from session where key = ? and name = ?', key, name);
        if(!result) {
            // 如果result不存在，那么插入这个session
            result = await db.run(`INSERT INTO session(key, name, value, created, expires)
          VALUES (?, ?, ?, ?, ?)`,
                key,
                name,
                JSON.stringify(data),
                Date.now(),
                Date.now() + ONE_WEEK * 1000);
        } else {
            // 否则更新这个session
            result = await db.run('UPDATE session SET value = ?, created = ?, expires = ? WHERE key = ? AND name = ?',
                JSON.stringify(data),
                Date.now(),
                Date.now() + ONE_WEEK * 1000,
                key,
                name);
        }
        return {err: '', result};
    } catch(e) {
        return {err: e.message};
    }
}

module.exports = {
    getSession,
    setSession
}
