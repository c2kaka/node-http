const url = require('url');
const path = require('path');

function check(rule, pathname) {
    const paramMatched = rule.match(/:[^/]+/g);

    const ruleExp = new RegExp(`^${rule.replace(/:[^/]+/g, '([^/]+)')}$`);
    const ruleMatched = pathname.match(ruleExp);

    if (ruleMatched && paramMatched) {
        return paramMatched.reduce((acc, cur, index) => {
            acc[cur.slice(1)] = ruleMatched[index + 1];
            return acc;
        }, {});
    }

    return null;
}

/*
    @method: GET/POST/PUT/DELETE
    @rule: 路径规则，比如：test/:course/:lecture
    @aspect: 拦截函数
*/
function route(method, rule, aspect) {
    return async (ctx, next) => {
        const req = ctx.req;
        if (!ctx.url) {
            ctx.url = url.parse(`http://${req.headers.host}${req.url}`);
        }

        const checked = check(rule, ctx.url.pathname);
        // 如果路径匹配，执行切面；否则跳过当前切面，继续执行
        if (!ctx.route && (method === '*' || method === req.method) && !!checked) {
            ctx.route = checked;
            await aspect(ctx, next);
        } else {
            await next();
        }
    };
}

class Router {
    constructor(base = '') {
        this.baseURL = base;
    }

    get(rule, aspect) {
        return route('GET', path.join(this.baseURL, rule), aspect);
    }

    post(rule, aspect) {
        return route('POST', path.join(this.baseURL, rule), aspect);
    }

    put(rule, aspect) {
        return route('PUT', path.join(this.baseURL, rule), aspect);
    }

    delete(rule, aspect) {
        return route('DELETE', path.join(this.baseURL, rule), aspect);
    }

    all(rule, aspect) {
        return route('*', path.join(this.baseURL, rule), aspect);
    }
}

module.exports = Router;
