const Server = require("./server-simple");
const Router = require("./router");
const param = require("./aspects/param");
const fs = require('fs');
const handlebars = require("handlebars");

const app = new Server();
const router = new Router();

app.use(({ req }, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(param);

app.use(
  router.get("/coronavirus/index", async ({ res }, next) => {
    const { getCoronavirusKeyIndex } = require("./mock/mock");
    const index = getCoronavirusKeyIndex();

    const handlebars = require('handlebars');
    const html = fs.readFileSync('./www/pages/covoid19.html', { encoding: 'utf-8' });
    const tpl = handlebars.compile(html);
    const body = tpl({data: index});

    res.setHeader("Content-Type", "text/html");
    res.body = body;
    await next();
  })
);

app.use(router.get('/coronavirus/:date', async ({params, route, res}, next) => {
    const {getCoronavirusByDate} = require('./mock/mock');
    const data = getCoronavirusByDate(route.date);

    if (params.type === 'json') { // url like this: http://localhost:8080/coronavirus/2020-01-25?type=json
        res.setHeader('Content-Type', 'application/json');
        res.body = {data};
    } else {
        const handlebars = require('handlebars');
        const html = fs.readFileSync('./www/pages/covoid-date.html', { encoding: 'utf-8' });
        const tpl = handlebars.compile(html);
        const body = tpl({data});

        res.setHeader('Content-Type', 'text/html');
        res.body = body;
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
