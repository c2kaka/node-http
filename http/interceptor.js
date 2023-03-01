class Interceptor {
    constructor() {
        this.aspects = [];
    }

    use(functor) {
        this.aspects.push(functor);
        return this;
    }

    async run(ctx) {
        const aspects = this.aspects;

        const proc = aspects.reduceRight(function (acc, cur) {
            return async () => {
                await cur(ctx, acc);
            };
        }, () => Promise.resolve());

        try {
            await proc();
        } catch (e) {
            console.error(e.message);
        }

        return ctx;
    }
}

/** test **/
// function wait(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }
//
// const inter = new Interceptor();
//
// const task = function(id) {
//     return async (ctx, next) => {
//         console.log(`task ${id} begin`);
//         ctx.count++;
//         await wait(1000);
//         console.log(`count: ${ctx.count}`);
//         await next();
//         console.log(`task ${id} end`);
//     };
// }
//
// // 将多个任务以拦截切面的方式注册到拦截器中
// inter.use(task(0));
// inter.use(task(1));
// inter.use(task(2));
// inter.use(task(3));
// inter.use(task(4));
//
// // 从外到里依次执行拦截切面
// inter.run({count: 0});


module.exports = Interceptor;
