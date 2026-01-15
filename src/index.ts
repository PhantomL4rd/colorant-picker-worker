import { Hono } from 'hono'
import { appContext } from './middleware'
import type { AppEnv } from './types'
import { APP_BASE_URL, extractColors } from './utils'
import { generateErrorImage, generateOgImage, generateShareHtml } from './views'

const app = new Hono<AppEnv>()

// ミドルウェア適用
app.use('/og/:data', appContext)
app.use('/share/:data', appContext)

/**
 * OGP画像生成
 * GET /og/:data
 */
app.get('/og/:data', async (c) => {
  try {
    const compressedData = c.req.param('data')
    const cacheControl = c.get('cacheControl').ogImage
    const colors = await extractColors(compressedData)

    return generateOgImage(colors, cacheControl)
  } catch (error) {
    console.error('Error generating OGP image:', error)
    return generateErrorImage()
  }
})

/**
 * シェアページ（OGPメタタグ付きHTML）
 * GET /share/:data
 */
app.get('/share/:data', (c) => {
  const compressedData = c.req.param('data')
  const host = c.req.header('host') || 'localhost'
  const protocol = c.get('protocol')
  const cacheControl = c.get('cacheControl').html

  const ogImageUrl = `${protocol}://${host}/og/${compressedData}`
  const targetUrl = `${APP_BASE_URL}/?palette=${compressedData}`

  return c.html(generateShareHtml(ogImageUrl, targetUrl), 200, {
    'Cache-Control': cacheControl,
  })
})

/**
 * シェアページ（パラメータなし）→ トップへリダイレクト
 * GET /share
 */
app.get('/share', (c) => c.redirect(APP_BASE_URL))

/**
 * ルートパス → トップへリダイレクト
 * GET /
 */
app.get('/', (c) => c.redirect(APP_BASE_URL))

export default app
