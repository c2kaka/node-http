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



module.exports = Interceptor;
