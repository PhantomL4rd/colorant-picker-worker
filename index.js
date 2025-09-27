import { handle } from 'hono/vercel'
import app from './src/app.js'

export const config = {
  runtime: 'edge',
  regions: ['nrt1', 'kix1']
}

export default handle(app)