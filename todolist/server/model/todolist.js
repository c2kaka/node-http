async function getList(db, userid) {
    return await db.all('select * from todo where status <> 2 and userid = ?', userid);
}

async function addTask(db, { text, status }) {
    try {
        const data = await db.run('insert into todo(text, status) values (?, ?)', text, status);
        return { err: '', data };
    } catch (e) {
        return { err: e.message };
    }
}

module.exports = {
    getList,
    addTask
}
