'use strict';

const fs = require('fs')
const http2 = require('http2')
const path = require('path')
const pino = require('pino')()

const key = fs.readFileSync('./jasnell-key.pem')
const cert = fs.readFileSync('./jasnell-cert.pem')

const server = http2.createSecureServer({ key, cert })
server.on('stream', (stream, headers) => {
  let p = headers[':path']
  if (p === '/' || p === '/index') {
    p = '/index.html';

    // [
    //   'css/reveal.css',
    //   'css/theme/nodejs.css',
    //   'lib/css/zenburn.css',
    //   'lib/font/source-sans-pro/source-sans-pro.css',
    //   'css/print/paper.css'
    // ].forEach((i) => {
    //   stream.pushStream({ ':path': `/${i}` }, (err, stream) => {
    //     pino.info({ 'method': 'push', ':path': `/${i}`, 'root': localPath }, '200')
    //     stream.respondWithFile(`./${i}`, { 'content-type': 'text/css' });
    //   });
    // });

    // [
    //   'js/reveal.js',
    //   'lib/js/head.min.js',
    //   'plugin/markdown/marked.js',
    //   'plugin/markdown/markdown.js',
    //   'plugin/highlight/highlight.js',
    //   'plugin/zoom-js/zoom.js',
    //   'plugin/notes/notes.js'
    // ].forEach((i) => {
    //   stream.pushStream({ ':path': `/${i}` }, (err, stream) => {
    //     pino.info({ 'method': 'push', ':path': `/${i}`, 'root': localPath }, '200')
    //     stream.respondWithFile(`./${i}`, {
    //       'content-type': 'application/javascript'
    //     });
    //   });
    // });

    fs.readdir('./media', (err, items) => {
      items.forEach((i) => {
        const file = `/media/${i}`
        pino.info({ 'method': 'push', ':path': file, 'root': localPath }, '200')
        stream.pushStream({ ':path': file }, (err, stream) => {
          stream.respondWithFile(`.${file}`)
        })
      });
    });

  }
  const localPath = path.resolve(__dirname, `.${p}`)
  fs.stat(localPath, (err, stat) => {
    if (err) {
      pino.error({ 'method': 'get', ':path': p, 'root': localPath }, '404')
      stream.respond({ ':status': 404 })
      stream.end('Not Found')
      return
    }
    pino.info({ 'method': 'get', ':path': p, 'root': localPath }, '200')
    stream.respond()
    const readStream = fs.createReadStream(localPath)
    readStream.pipe(stream)
  })
})

server.listen(8888, () => {
  pino.info('HTTP/2 Server is listening on port 8888')
})
