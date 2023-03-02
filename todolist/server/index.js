const Server = require("../server/lib/server");
const Router = require("../server/lib/router");
const param = require("../server/aspects/param");
const fs = require('fs');
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
const path = require('path');
const url = require('url');
const zlib = require('zlib');
const mime = require("mime");
const cookie = require("./aspects/cookie");
const {SESSION_KEY, ONE_WEEK, USER_SESSION_KEY} = require("./constants");
const {getList, addTask} = require("./model/todolist");

const app = new Server();
const router = new Router();

const dbFile = path.resolve(__dirname, '../database/todolist.db');
let db = null;

app.use( async ({ req }, next) => {
    console.log(`${req.method} ${req.url}`);
    await next();
});

app.use(param);

app.use(cookie);

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

app.use(async ({ cookie, res }, next) => {
    let id = cookie[SESSION_KEY];
    if (!id) {
        id = Math.random().toString(36).slice(2);
    }
    res.setHeader('Set-Cookie', `${SESSION_KEY}=${id}; Path=/; Max-Age=${ONE_WEEK}`);
    await next();
});

async function checkLogin(ctx) {
    const { getSession } = require('./model/session');
    const userInfo = await getSession(ctx.database, ctx, USER_SESSION_KEY);
    ctx.userInfo = userInfo;
    return userInfo;
}

app.use(router.get('/list', async (ctx, next) => {
    const { database, res } = ctx;
    const userInfo = await checkLogin(ctx);
    res.setHeader('Content-Type', 'application/json');

    if (!!userInfo) {
        const { getList } = require('./model/todolist');
        const data = await getList(database, userInfo.id);
        res.body = { data };
    } else {
        res.body = { err: 'please login' };
    }

    await next();
}));

app.use(router.post('/add', async (ctx, next) => {
    const { database, params, res } = ctx;
    const userInfo = await checkLogin(ctx);
    res.setHeader('Content-Type', 'application/json');

    if (!!userInfo) {
        const { addTask } = require('./model/todolist');
        const data = await addTask(database, params);
        res.statusCode = 200;
        res.body = { data };
    } else {
        res.statusCode = 403;
        res.body = { err: 'please login' };
    }
    await next();
}));

// login router
app.use(router.post('/login', async (ctx, next) => {
    const {database, res} = ctx;
    const { login } = require('./model/user');
    const data = await login(database, ctx);
    res.statusCode = 302;

    if (!data) {
        res.setHeader('Location', '/login.html');
    } else {
        res.setHeader('Location', '/');
    }
    await next();
}));

app.use(router.all('.*', async ({params, req, res}, next) => {
    let filePath = path.resolve(__dirname, path.join('../www', url.fileURLToPath(`file:///${req.url}`)));

    if(fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if(stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
        if(fs.existsSync(filePath)) {
            const {ext} = path.parse(filePath);
            const stats = fs.statSync(filePath);
            const timeStamp = req.headers['if-modified-since'];
            res.statusCode = 200;
            if(timeStamp && Number(timeStamp) === stats.mtimeMs) {
                res.statusCode = 304;
            }
            const mimeType = mime.getType(ext);
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Cache-Control', 'max-age=86400');
            res.setHeader('Last-Modified', stats.mtimeMs);
            const acceptEncoding = req.headers['accept-encoding'];
            const compress = acceptEncoding && /^(text|application)\//.test(mimeType);
            let compressionEncoding;
            if(compress) {
                acceptEncoding.split(/\s*,\s*/).some((encoding) => {
                    if(encoding === 'gzip') {
                        res.setHeader('Content-Encoding', 'gzip');
                        compressionEncoding = encoding;
                        return true;
                    }
                    if(encoding === 'deflate') {
                        res.setHeader('Content-Encoding', 'deflate');
                        compressionEncoding = encoding;
                        return true;
                    }
                    if(encoding === 'br') {
                        res.setHeader('Content-Encoding', 'br');
                        compressionEncoding = encoding;
                        return true;
                    }
                    return false;
                });
            }
            if(res.statusCode === 200) {
                const fileStream = fs.createReadStream(filePath);
                if(compress && compressionEncoding) {
                    let comp;
                    if(compressionEncoding === 'gzip') {
                        comp = zlib.createGzip();
                    } else if(compressionEncoding === 'deflate') {
                        comp = zlib.createDeflate();
                    } else {
                        comp = zlib.createBrotliCompress();
                    }
                    res.body = fileStream.pipe(comp);
                } else {
                    res.body = fileStream;
                }
            }
        }
    } else {
        res.setHeader('Content-Type', 'text/html');
        res.body = '<h1>Not Found</h1>';
        res.statusCode = 404;
    }

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
