async function getList(db) {
    return await db.all('select * from todo');
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
