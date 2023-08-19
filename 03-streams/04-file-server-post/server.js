const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pump = promisify(pipeline);
const LimitSizeStream = require('./LimitSizeStream');

const server = http.createServer();

server.on('request', async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.slice(1);

  if (pathname.includes('/')) {
    res.statusCode = 400;
    res.end('Nested paths are not allowed');
    return;
  }

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':
      try {
        await fs.promises.access(filepath, fs.constants.F_OK);
        res.statusCode = 409;
        res.end();
        return;
      } catch (err) {
      }

      let requestBodySize = 0;

      req.on('data', (chunk) => {
        requestBodySize += chunk.length;

        if (requestBodySize >= 1024 * 1024) {
          res.statusCode = 413;
          res.end('File size exceeds the limit');
          req.destroy();
        }
      });

      const limitSizeStream = new LimitSizeStream({ limit: 1024 * 1024, readableObjectMode: true });
      const writeStream = fs.createWriteStream(filepath);

      req.on('aborted', () => {
        fs.unlink(filepath, (unlinkError) => {
          if (unlinkError) console.error('Error deleting file:', unlinkError);
        });
      });

      try {
        await pump(req, limitSizeStream, writeStream);
        res.statusCode = 201;
        res.end('File uploaded successfully');
      } catch (pipelineError) {
        if (!res.finished) {
          console.log(pipelineError);
          if (pipelineError instanceof LimitExceededError) {
            res.statusCode = 413;
            res.end('File size exceeds the limit');
          } else {
            res.statusCode = 500;
            res.end('Internal Server Error');
          }
          fs.unlink(filepath, (unlinkError) => {
            if (unlinkError) console.error('Error deleting file:', unlinkError);
          });
        }
      }
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
