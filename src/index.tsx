import { Hono } from 'hono'
import { ImageResponse } from '@cloudflare/pages-plugin-vercel-og/api'
import LZString from 'lz-string'

const app = new Hono()

const GH_BASE = 'https://phantoml4rd.github.io/ffxiv-colorant-picker'
const DYES_URL = `${GH_BASE}/data/dyes.json`
const MAX_QUERY_LENGTH = 2048
const MAX_JSON_LENGTH = 10000

let dyesCache: Record<string, { name: string; rgb: { r: number; g: number; b: number } }> | null =
  null

const toHex = (rgb: { r: number; g: number; b: number }) =>
  '#' + [rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, '0')).join('')

const decodeParam = (raw: string | null) => {
  if (!raw || raw.length > MAX_QUERY_LENGTH) {
    console.log('Parameter too long or empty:', raw?.length)
    return null
  }
  const json = LZString.decompressFromEncodedURIComponent(raw)
  if (!json || json.length > MAX_JSON_LENGTH) {
    console.log('Failed to decompress or decompressed data too large:', {
      compressed: raw?.substring(0, 50) + '...',
      decompressed: json?.substring(0, 100) + '...',
      decompressedLength: json?.length,
    })
    return null
  }
  try {
    return JSON.parse(json)
  } catch (e) {
    console.log('JSON parse error:', e, json)
    return null
  }
}

const getDyes = async () => {
  if (dyesCache) return dyesCache
  try {
    const res = await fetch(DYES_URL)
    const data = await res.json() as { dyes?: Array<{ id: string; name: string; rgb: { r: number; g: number; b: number } }> }
    const dyeMap: Record<string, { name: string; rgb: { r: number; g: number; b: number } }> = {}
    if (data.dyes && Array.isArray(data.dyes)) {
      for (const dye of data.dyes) {
        dyeMap[dye.id] = {
          name: dye.name,
          rgb: dye.rgb,
        }
      }
    }
    dyesCache = dyeMap
    return dyeMap
  } catch (e) {
    console.error('Failed to fetch dyes:', e)
    return {}
  }
}

// /og - OGP画像生成
app.get('/og', async (c) => {
  try {
    const paletteParam = c.req.query('palette')
    const customParam = c.req.query('custom-palette')

    const host = c.req.header('host') || 'localhost'
    const isDev = host.includes('localhost') || host.includes('127.0.0.1')
    const cacheControl = isDev ? 'no-cache' : 'public, max-age=604800, s-maxage=604800'

    let colors = ['#ffffff', '#666666', '#000000']

    if (paletteParam || customParam) {
      const data = decodeParam(paletteParam || customParam)
      if (data) {
        console.log('Decoded data:', JSON.stringify(data))
        const dyes = await getDyes()
        console.log('Dyes loaded:', Object.keys(dyes).length, 'entries')
        console.log('Looking for:', data.p, data.s)

        if (typeof data.p === 'string' && dyes[data.p]) {
          colors[0] = toHex(dyes[data.p].rgb)
        } else if (data.p?.type === 'custom' && data.p.rgb) {
          colors[0] = toHex(data.p.rgb)
        }

        if (data.s?.[0] && dyes[data.s[0]]) {
          colors[1] = toHex(dyes[data.s[0]].rgb)
        }
        if (data.s?.[1] && dyes[data.s[1]]) {
          colors[2] = toHex(dyes[data.s[1]].rgb)
        }
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {/* 左：メイン 61.8% */}
          <div
            style={{
              flex: 61.8,
              backgroundColor: colors[0],
              display: 'flex',
              position: 'relative',
              alignItems: 'flex-end',
              justifyContent: 'flex-start',
            }}
          />

          {/* 右：残りを縦に 23.6% / 14.6% */}
          <div
            style={{
              flex: 38.2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                flex: 23.6,
                backgroundColor: colors[1],
                display: 'flex',
                position: 'relative',
                alignItems: 'flex-end',
                justifyContent: 'flex-start',
              }}
            />
            <div
              style={{
                flex: 14.6,
                backgroundColor: colors[2],
                display: 'flex',
                position: 'relative',
                alignItems: 'flex-end',
                justifyContent: 'flex-start',
              }}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': cacheControl,
        },
      },
    )
  } catch (error) {
    console.error('Error generating OGP image:', error)

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            backgroundColor: '#1a1a1a',
            fontFamily: 'sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: '32px',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            FFXIV Colorant Picker
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'no-cache',
        },
      },
    )
  }
})

// /share - OGPメタ付きHTMLでリダイレクト
app.get('/share', (c) => {
  const palette = c.req.query('palette')
  const custom = c.req.query('custom-palette')
  const query = palette
    ? `palette=${encodeURIComponent(palette)}`
    : custom
      ? `custom-palette=${encodeURIComponent(custom)}`
      : ''
  const target = `https://phantoml4rd.github.io/ffxiv-colorant-picker/${query ? `?${query}` : ''}`

  const host = c.req.header('host') || 'localhost'
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
  const og = `${protocol}://${host}/og${query ? `?${query}` : ''}`

  const html = `<!doctype html><html><head>
<meta charset="utf-8"/>
<title>FFXIV Colorant Picker</title>
<meta property="og:title" content="FFXIV Colorant Picker" />
<meta property="og:description" content="FF14のカララントの組み合わせを配色理論に基づいて提案するツール" />
<meta property="og:site_name" content="FF14 カララントピッカー" />
<meta property="og:image" content="${og}"/>
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="FFXIV カララントピッカー" />
<meta name="twitter:description" content="FF14のカララントの組み合わせを配色理論に基づいて提案するツール" />
<meta name="twitter:image" content="${og}"/>
<link rel="canonical" href="${target}"/>
<meta name="robots" content="noindex,follow"/>
<meta http-equiv="refresh" content="0;url=${target}"/>
</head>
<body style="background:#0b0d10;color:#fff;display:grid;place-items:center;height:100vh">
<p>Redirecting… <a href="${target}">open</a></p>
<script>location.replace(${JSON.stringify(target)})</script>
</body></html>`

  const isDev = host.includes('localhost') || host.includes('127.0.0.1')
  const cacheControl = isDev ? 'no-cache' : 'public, max-age=604800, immutable'

  return c.html(html, 200, {
    'Cache-Control': cacheControl,
  })
})

// ルートパス
app.get('/', (c) => {
  return c.redirect('/share')
})

export default app
