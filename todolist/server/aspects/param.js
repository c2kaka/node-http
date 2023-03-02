const url = require("url");
const querystring = require("querystring");

module.exports = async function (ctx, next) {
  // parse url query
  const { req } = ctx;
  const { query } = url.parse(`http://${req.headers.host}${req.url}`);
  ctx.params = querystring.parse(query);

  // parse post
  if (req.method === 'POST') {
    // get body
    const body = await new Promise((resolve) => {
      let res = '';
      req.on('data', chunk => {
        res = chunk + res;
      });

      req.on('end', () => {
        resolve(res);
      })
    });

    ctx.params = ctx.params || {};
    const headers = req.headers;
    if (headers['content-type'] === 'application/x-www-form-urlencoded') {
      Object.assign(ctx.params, querystring.parse(body));
    } else if (headers['content-type'] === 'application/json') {
      Object.assign(ctx.params, JSON.parse(body));
    }
  }

  await next();
};
