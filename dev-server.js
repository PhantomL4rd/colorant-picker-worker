import { serve } from '@hono/node-server'
import app from './src/app.tsx'

serve({
  fetch: app.fetch,
  port: 3001,
})

console.log('🚀 Dev server running on http://localhost:3001')