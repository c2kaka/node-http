const http = require("http");
const url = require("url");
const path = require("path");
const fs = require('fs');
const mime = require('mime');
const checkSum = require('checksum');

function normalizeFilePath(filePath) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    return filePath;
}

const server = http.createServer((req, res) => {
    let filePath = normalizeFilePath(path.resolve(
        __dirname,
        path.join("www", url.fileURLToPath(`file:///${req.url}`))
    ));

    // 存在文件，返回index.html, 否则404

    if (!fs.existsSync(filePath)) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('<h1>Not Found</h1>');
        return;
    }

    checkSum.file(filePath, (err, sum) => {
        sum = `"${sum}"`

        if (req.headers['if-none-match'] === sum) {
            res.writeHead(304, {
                'Content-Type': mime.getType(filePath),
                etag: sum,
            });
            res.end();
        } else {
            res.writeHead(200, {
                'Content-Type': mime.getType(filePath),
                etag: sum,
            });
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        }
    });
});

server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8080, "localhost", () => {
    console.log("opened server on,", server.address());
});
