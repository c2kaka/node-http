const Server = require("./server-simple");
const Router = require("./router");
const param = require("./aspects/param");

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
    res.setHeader("Content-Type", "application/json");
    res.body = { data: index };
    await next();
  })
);

app.use(router.get('/coronavirus/:date', async ({route, res}, next) => {
    const {getCoronavirusByDate} = require('./mock/mock');
    const data = getCoronavirusByDate(route.date);
    res.setHeader('Content-Type', 'application/json');
    res.body = {data};
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
