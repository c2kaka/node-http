const http = require("http");
const Interceptor = require("./interceptor.js");

class Server {
    constructor() {
        const interceptor = new Interceptor();

        this.server = http.createServer(async (req, res) => {
            await interceptor.run({ req, res });

            if (!res.writableFinished) {
                let body = res.body || "200 OK";
                if (body.pipe) {
                    body.pipe(res);
                } else {
                    if (
                        typeof body !== "string" &&
                        res.getHeaders()["content-type"] === "application/json"
                    ) {
                        body = JSON.stringify(body);
                    }
                    res.end(body);
                }
            }
        });

        this.server.on("clientError", (err, socket) => {
            socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
        });

        this.interceptor = interceptor;
    }

    listen(opts, cb = () => {}) {
        if (typeof opts === "number") {
            opts = { port: opts };
        }

        opts.host = opts.host || "0.0.0.0";
        console.log(`Starting up http-server 
        http://${opts.host}:${opts.port}`);

        this.server.listen(opts, () => cb(this.server));
    }

    use(aspect) {
        this.interceptor.use(aspect);
    }
}

module.exports = Server;