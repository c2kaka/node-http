async function getList(db) {
    const res = await db.all('select * from todo');
    return res;
}

module.exports = {
    getList
}
