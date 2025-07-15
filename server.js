const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'  // Azure App Service用
const port = parseInt(process.env.PORT || process.env.WEBSITES_PORT || '8080', 10)  // Azure App Service用

console.log(`Starting server on ${hostname}:${port} (dev: ${dev})`)
console.log(`Environment: NODE_ENV=${process.env.NODE_ENV}`)
console.log(`Available PORT: ${process.env.PORT}`)
console.log(`Available WEBSITES_PORT: ${process.env.WEBSITES_PORT}`)

// Next.jsアプリケーションを初期化
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Ready状態を追跡
let isReady = false

app.prepare().then(() => {
  isReady = true
  console.log('Next.js application prepared successfully')
  
  createServer(async (req, res) => {
    try {
      // ヘルスチェック用のエンドポイント
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          status: 'OK', 
          ready: isReady,
          timestamp: new Date().toISOString(),
          port: port,
          hostname: hostname
        }))
        return
      }

      // Ready状態チェック
      if (!isReady) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'Service Unavailable', message: 'App is starting up' }))
        return
      }

      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })
  .once('error', (err) => {
    console.error('Server error:', err)
    process.exit(1)
  })
  .listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Server is ready to accept connections`)
  })
}).catch((ex) => {
  console.error('Failed to start server:', ex)
  process.exit(1)
})
