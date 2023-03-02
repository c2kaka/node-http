const http = require("http");
const cluster = require("cluster");
const cpuNums = require("os").cpus().length;
const Interceptor = require("./interceptor.js");

class Server {
    constructor({ instances = 1, enableCluster = true, mode = 'production' } = {}) {
        const interceptor = new Interceptor();

        if (mode === 'development') {
            instances = 1;
            enableCluster = true;
        }

        this.instances = instances || cpuNums;
        this.enableCluster = enableCluster;
        this.mode = mode;

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

        const broadCast = (message) => {
            Object.entries(cluster.workers).forEach(([id, worker]) => {
                worker.send(message);
            });
        };

        if (this.enableCluster && cluster.isPrimary) {
            for (let i = 0; i < this.instances; i++) {
                cluster.fork();
            }

            Object.keys(cluster.workers).forEach((id) => {
                cluster.workers[id].on('message', broadCast);
            });

            if(this.mode === 'development') {
                require('fs').watch('.', {recursive: true}, (eventType) => { // 监听js文件是否更新
                    if(eventType === 'change') { // 如果文件更新，则重开一个进程
                        Object.entries(cluster.workers).forEach(([id, worker]) => {
                            console.log('kill workder %d', id);
                            worker.kill();
                        });
                        cluster.fork();
                    }
                });
            } else {
                cluster.on('exit', (worker, code, signal) => {
                    console.log('worker %d died (%s). restarting...',
                        worker.process.pid, signal || code);
                    cluster.fork();
                });
            }
        } else {
            this.worker = cluster.worker;
            console.log(`Starting up http-server 
            http://${opts.host}:${opts.port}`);
            this.server.listen(opts, () => cb(this.server));
        }
    }

    use(aspect) {
        this.interceptor.use(aspect);
    }
}

module.exports = Server;
