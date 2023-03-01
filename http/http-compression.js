const http = require("http");
const url = require("url");
const path = require("path");
const fs = require('fs');
const mime = require('mime');
const checkSum = require('checksum');
const zlib = require('zlib');

function normalizeFilePath(filePath) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    return filePath;
}

function getContentEncoding(req, filePath) {
    const acceptEncoding = req.headers['accept-encoding'];
    const compress = acceptEncoding && /^(text|application)\//.test(mime.getType(filePath));

    if (!compress) {
        return null;
    }

    return acceptEncoding.split(/\s*,\s*/)[0];
}

function getCompressionMethod(contentEncoding) {
    let comp;
    if(contentEncoding === 'gzip') {
        comp = zlib.createGzip();
    } else if(contentEncoding === 'deflate') {
        comp = zlib.createDeflate();
    } else {
        comp = zlib.createBrotliCompress();
    }

    return comp;
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

    const responseHeader = {
        'Content-Type': mime.getType(filePath),
    };

    const contentEncoding =  getContentEncoding(req, filePath);
    if (contentEncoding) {
        responseHeader['Content-Encoding'] = contentEncoding;
    }

    checkSum.file(filePath, (err, sum) => {
        sum = `"${sum}"`

        responseHeader['etag'] = sum;

        if (req.headers['if-none-match'] === sum) {
            res.writeHead(304, responseHeader);
            res.end();
        } else {
            res.writeHead(200, responseHeader);
            const stream = fs.createReadStream(filePath);
            if (responseHeader['Content-Encoding']) {
                stream.pipe(getCompressionMethod(responseHeader['Content-Encoding'])).pipe(res);
            } else {
                stream.pipe(res);
            }
        }
    });
});

server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8080, "localhost", () => {
    console.log("opened server on,", server.address());
});
