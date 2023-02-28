const http = require("http");
const url = require("url");
const path = require("path");
const fs = require('fs');
const mime = require('mime');

const server = http.createServer((req, res) => {
  let filePath = path.resolve(
    __dirname,
    path.join("www", url.fileURLToPath(`file:///${req.url}`))
  );

  // 存在文件，返回index.html, 否则404
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const isDir = stats.isDirectory();

    if (isDir) {
      filePath = path.join(filePath, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      // const content = fs.readFileSync(filePath);

      const { ext } = path.parse(filePath);
      const stats = fs.statSync(filePath);
      const timeStamp = req.headers['if-modified-since'];
      let status = 200;

      if (timeStamp && Number(timeStamp) === stats.mtimeMs) {
        status = 304;
      }

      res.writeHead(status, {
        'Content-Type': mime.getType(ext),
        'Cache-Control': 'max-age=86400',
        'Last-Modified': stats.mtimeMs,
      });

      if (status === 200) {
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else if (status === 304) {
        res.end();
      }
    }
  } else {
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end('<h1>Not Found</h1>');
  }
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8080, "localhost", () => {
  console.log("opened server on,", server.address());
});
