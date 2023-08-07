const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const server = new http.Server();

server.on('request', (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'GET':
      const isNested = pathname.includes('/');

      if (isNested) {
        res.statusCode = 400;
        res.end();
      } else {
        if (filepath.includes('/')) {
          res.statusCode = 404;
          res.end();
        }

        const readStream = fs.createReadStream(filepath);

        readStream.on('error', () => {
          res.statusCode = 404;
          res.end();
        }).on('data', (chunk) => {
          res.statusCode = 200;
          res.end(chunk);
        })
      }
      break;
    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
