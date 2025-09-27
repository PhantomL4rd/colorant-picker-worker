import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import LZString from 'lz-string'

export const runtime = 'edge'

const GH_BASE = 'https://phantoml4rd.github.io/ffxiv-colorant-picker'
const DYES_URL = `${GH_BASE}/data/dyes.json`
const MAX_QUERY_LENGTH = 2048
const MAX_JSON_LENGTH = 10000

let dyesCache: Record<string, {name: string, rgb: {r:number,g:number,b:number}}> | null = null

const toHex = (rgb:{r:number;g:number;b:number}) =>
  '#'+[rgb.r,rgb.g,rgb.b].map(v=>v.toString(16).padStart(2,'0')).join('')

const decodeParam = (raw:string|null) => {
  if (!raw || raw.length>MAX_QUERY_LENGTH) {
    console.log('Parameter too long or empty:', raw?.length)
    return null
  }
  const json=LZString.decompressFromEncodedURIComponent(raw)
  if (!json || json.length>MAX_JSON_LENGTH) {
    console.log('Failed to decompress or decompressed data too large:', {
      compressed: raw?.substring(0, 50) + '...',
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

const getDyes = async () => {
  if (dyesCache) return dyesCache
  try {
    const res = await fetch(DYES_URL)
    const data = await res.json()
    // dyesが配列なので、IDでマッピングする
    const dyeMap: Record<string, {name: string, rgb: {r:number,g:number,b:number}}> = {}
    if (data.dyes && Array.isArray(data.dyes)) {
      for (const dye of data.dyes) {
        dyeMap[dye.id] = {
          name: dye.name,
          rgb: dye.rgb
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paletteParam = searchParams.get('palette')
    const customParam = searchParams.get('custom-palette')
    
    const host = request.headers.get('host') || 'localhost'
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
            width: '800px',
            height: '800px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{
            flex: '3',
            backgroundColor: colors[0],
            display: 'flex',
            position: 'relative',
            alignItems: 'flex-end',
            justifyContent: 'flex-start'
          }}>
          </div>
          
          <div style={{
            flex: '2',
            backgroundColor: colors[1],
            display: 'flex',
            position: 'relative',
            alignItems: 'flex-end',
            justifyContent: 'flex-start'
          }}>
          </div>
          
          <div style={{
            flex: '1',
            backgroundColor: colors[2],
            display: 'flex',
            position: 'relative',
            alignItems: 'flex-end',
            justifyContent: 'flex-start'
          }}>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 800,
        headers: {
          'Cache-Control': cacheControl,
        },
      }
    )
  } catch (error) {
    console.error('Error generating OGP image:', error)
    
    return new ImageResponse(
      (
        <div
          style={{
            width: '800px',
            height: '800px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1a1a1a',
            fontFamily: 'sans-serif',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{
            color: 'white',
            fontSize: '32px',
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: '20px',
            display: 'flex'
          }}>
            FFXIV Colorant Picker
          </div>
          <div style={{
            color: '#888',
            fontSize: '20px',
            textAlign: 'center',
            display: 'flex'
          }}>
            配色パレット生成ツール
          </div>
        </div>
      ),
      {
        width: 800,
        height: 800,
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    )
  }
}