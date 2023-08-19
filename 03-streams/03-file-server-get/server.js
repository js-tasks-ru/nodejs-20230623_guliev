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
        res.end('Nested paths are not allowed');
        return;
      }

      fs.access(filepath, fs.constants.F_OK, (err) => {
        if (err) {
          res.statusCode = 404;
          res.end('File not found');
          return;
        }
        const readStream = fs.createReadStream(filepath);
        readStream.on('error', () => {
          res.statusCode = 500;
          res.end('Server error');
          return;
        });
        res.statusCode = 200;
        readStream.pipe(res);
      });
      break;
      
    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
