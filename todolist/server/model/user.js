const crypto = require('crypto');
const { setSession } = require('./session');
const sessionName = 'userInfo';

function getCryptPassword(password) {
    const salt = 'milan';
    return crypto.createHash('sha256').update(`${salt}${password}`, 'utf-8').digest('hex');
}

async function login(db, ctx) {
    const { username, password } = ctx.params;
    const user = await db.get('select * from user where name = ?', username);

    if (!!user && user.password === getCryptPassword(password)) {
        const data  = { id: user.id, username };
        await setSession(sessionName, ctx, sessionName, data);
        return data;
    }

    return null;
}

module.exports = {
    login
};
