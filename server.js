const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3000

console.log('Starting Next.js server...')
console.log('Environment:', process.env.NODE_ENV)
console.log('Port:', port)

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('Next.js app prepared successfully')
  
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err)
      process.exit(1)
    })
    .listen(port, '0.0.0.0', () => {
      console.log(`> Ready on port ${port}`)
    })
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err)
  process.exit(1)
})