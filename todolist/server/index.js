const Server = require("../server/lib/server");
const Router = require("../server/lib/router");
const param = require("../server/aspects/param");
const fs = require('fs');
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
const path = require('path');

const app = new Server();
const router = new Router();

const dbFile = path.resolve(__dirname, '../database/todolist.db');
let db = null;

app.use( async ({ req }, next) => {
    console.log(`${req.method} ${req.url}`);
    await next();
});

app.use(param);

app.use(async (ctx, next) => {
    if (!db) {
        db = await open({
            filename: dbFile,
            driver: sqlite3.cached.Database
        });
    }

    ctx.database = db;
    await next();
});

app.use(router.get('/list', async ({ database, res }, next) => {
    res.setHeader('Content-Type', 'application/json');
    const { getList } = require('./model/todolist');
    const data = await getList(database);
    res.body = { data };

    await next();
}));

app.use(router.all('.*', async ({params, req, res}, next) => {
    res.setHeader('Content-Type', 'text/html');
    res.body = '<h1>Not Found</h1>';
    res.statusCode = 404;
    await next();
}));

app.listen({
    port: 8080,
    host: "localhost",
});
