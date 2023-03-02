async function cookie(ctx, next) {
    // generate cookies on ctx
    const { req } = ctx;
    const cookieStr = encodeURIComponent(req.headers.cookie);
    const cookies = cookieStr.split(/\s*;\s*/);
    ctx.cookie = {};
    cookies.forEach((_c) => {
        [key, value] = _c.split('=');
        ctx.cookie[key] = value;
    })
    await next();
}
