import { Hono } from 'hono'
import LZString from 'lz-string'
import { ImageResponse } from 'next/og'

const app = new Hono()
const GH_BASE = 'https://phantoml4rd.github.io/ffxiv-colorant-picker'
const MAX_QUERY_LENGTH = 2048
const MAX_JSON_LENGTH = 10000

type SharePaletteData = { p: string; s: [string, string]; pt: string }
type CustomColorShare = { type: 'custom'; name: string; rgb: { r: number; g: number; b: number } }
type ExtendedSharePaletteData = { p: CustomColorShare; s: [string, string]; pt: string }

const PATTERN_LABEL_JA: Record<string,string> = {
  triadic: 'バランス',
  'split-complementary': 'アクセント',
  analogous: 'グラデーション',
  monochromatic: '同系色',
  similar: 'ナチュラル',
  contrast: 'コントラスト',
  vivid: 'ビビッド',
  muted: 'ミュート',
}

const toHex = (rgb:{r:number;g:number;b:number}) =>
  '#'+[rgb.r,rgb.g,rgb.b].map(v=>v.toString(16).padStart(2,'0')).join('')
const saneHex = (x?:string) => x && /^#?[0-9a-fA-F]{6}$/.test(x) ? ('#'+x.replace('#','')) : undefined
const decodeParam = (raw:string|null) => {
  if (!raw || raw.length>MAX_QUERY_LENGTH) {
    console.log('Parameter too long or empty:', raw?.length)
    return null
  }
  const json=LZString.decompressFromEncodedURIComponent(raw)
  if (!json || json.length>MAX_JSON_LENGTH) {
    console.log('Failed to decompress or decompressed data too large:', {
      compressed: raw.substring(0, 50) + '...',
      decompressed: json?.substring(0, 100) + '...',
      decompressedLength: json?.length
    })
    return null
  }
  try { return JSON.parse(json) } catch (e) { 
    console.log('JSON parse error:', e, json)
    return null 
  }
}

// /api/og
app.get('/api/og', async c => {
  const p = c.req.query('palette')
  const cp = c.req.query('custom-palette')
  console.log('Raw params:', { palette: p, customPalette: cp })
  const dataP = p ? decodeParam(p) as SharePaletteData|null : null
  const dataC = cp ? decodeParam(cp) as ExtendedSharePaletteData|null : null

  let catalog: Record<string,{hex:string; name_ja?:string; name_en?:string}> = {}
  try {
    const res = await fetch(`${GH_BASE}/data/dyes.json`, { cache:'force-cache' })
    if (res.ok) {
      const data = await res.json()
      // Convert array to object with id as key
      if (data.dyes && Array.isArray(data.dyes)) {
        catalog = data.dyes.reduce((acc: any, dye: any) => {
          acc[dye.id] = {
            hex: dye.hex,
            name_ja: dye.name,
            name_en: dye.name
          }
          return acc
        }, {})
      }
      console.log('Catalog loaded:', Object.keys(catalog).length, 'items')
    }
  } catch (e) {
    console.log('Failed to load dyes catalog:', e)
  }

  let colors: string[] = []
  let colorNames: string[] = []
  let subtitle = ''

  if (dataC && dataC.p?.type==='custom') {
    const baseHex = toHex(dataC.p.rgb)
    const s1 = catalog[dataC.s[0]], s2 = catalog[dataC.s[1]]
    colors = [ saneHex(baseHex)??'#777777', saneHex(s1?.hex)??'#777777', saneHex(s2?.hex)??'#777777' ]
    colorNames = [dataC.p.name || 'カスタム', s1?.name_ja || s1?.name_en || 'Unknown', s2?.name_ja || s2?.name_en || 'Unknown']
    subtitle = 'FF14 color palette sharing'
  } else if (dataP) {
    const p1 = catalog[dataP.p], s1 = catalog[dataP.s[0]], s2 = catalog[dataP.s[1]]
    colors = [ saneHex(p1?.hex)??'#777777', saneHex(s1?.hex)??'#777777', saneHex(s2?.hex)??'#777777' ]
    colorNames = [p1?.name_ja || p1?.name_en || 'Unknown', s1?.name_ja || s1?.name_en || 'Unknown', s2?.name_ja || s2?.name_en || 'Unknown']
    subtitle = 'FF14 color palette sharing'
  } else {
    colors = ['#222222','#888888','#eeeeee']
    colorNames = ['Unknown', 'Unknown', 'Unknown']
    subtitle = 'FF14 color palette sharing'
  }

  const img = new ImageResponse(
    (
      <div style={{
        width: 800,
        height: 800,
        display: 'flex',
        flexDirection: 'column'
      }}>
          {/* メインカラー（大きめ） */}
          <div style={{
            flex: 5,
            background: colors[0]
          }} />
          
          {/* セカンダリカラー1 */}
          <div style={{
            flex: 2.5,
            background: colors[1]
          }} />
          
          {/* セカンダリカラー2 */}
          <div style={{
            flex: 1,
            background: colors[2]
          }} />
      </div>
    ), { width: 800, height: 800 }
  )
  return new Response((img as any).body, {
    headers:{
      'Content-Type':'image/png',
      'Cache-Control': c.req.header('host')?.includes('localhost') 
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=31536000, immutable'
    }
  })
})

// /share
app.get('/share', c => {
  const palette = c.req.query('palette')
  const custom = c.req.query('custom-palette')
  const query = palette ? `palette=${encodeURIComponent(palette)}`
              : custom ? `custom-palette=${encodeURIComponent(custom)}` : ''
  const target = `https://phantoml4rd.github.io/ffxiv-colorant-picker/${query?`?${query}`:''}`
  const host = c.req.header('host') || 'localhost'
  const og = `https://${host}/api/og${query?`?${query}`:''}`

  const html = `<!doctype html><html><head>
<meta charset="utf-8"/>
<title>FFXIV Colorant Picker</title>
<meta property="og:description" content="FF14のカララントの組み合わせを配色理論に基づいて提案するツール" />
<meta property="og:site_name" content="FF14 カララントピッカー" />
<meta property="og:image" content="${og}"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="canonical" href="${target}"/>
<meta name="robots" content="noindex,follow"/>
<meta http-equiv="refresh" content="0;url=${target}"/>
</head>
<body style="background:#0b0d10;color:#fff;display:grid;place-items:center;height:100vh">
<p>Redirecting… <a href="${target}">open</a></p>
<script>location.replace(${JSON.stringify(target)})</script>
</body></html>`
  return new Response(html, { headers:{'Content-Type':'text/html; charset=utf-8'} })
})

export default app