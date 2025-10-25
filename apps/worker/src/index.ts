import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  RATE_LIMIT_KV: KVNamespace
  PDF_STORAGE: R2Bucket
  BROWSER: Fetcher
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS configuration
app.use('/*', cors({
  origin: ['https://speedstein.com', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes will be added here
app.post('/api/generate', async (c) => {
  return c.json({ success: false, error: 'Not implemented' }, 501)
})

export default app
