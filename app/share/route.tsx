import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const palette = searchParams.get('palette')
  const custom = searchParams.get('custom-palette')
  const query = palette ? `palette=${encodeURIComponent(palette)}`
              : custom ? `custom-palette=${encodeURIComponent(custom)}` : ''
  const target = `https://phantoml4rd.github.io/ffxiv-colorant-picker/${query?`?${query}`:''}`
  
  const host = request.headers.get('host') || 'localhost'
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
  const og = `${protocol}://${host}/og${query?`?${query}`:''}`

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
  
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': cacheControl
    }
  })
}