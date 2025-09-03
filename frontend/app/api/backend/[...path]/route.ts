import { NextRequest, NextResponse } from 'next/server'

const PRIMARY_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || ''

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function forward(req: NextRequest, path: string[]) {
  const candidates = [
    PRIMARY_BACKEND,
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'http://0.0.0.0:8000',
  ].filter(Boolean)

  const init: RequestInit = {
    method: req.method,
    headers: new Headers(req.headers),
    cache: 'no-store',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await req.text()
    init.body = body
  }

  // Remove Next.js specific headers
  ;(init.headers as Headers).delete('host')
  ;(init.headers as Headers).delete('x-forwarded-host')

  const errors: string[] = []
  for (const base of candidates) {
    const targetUrl = `${base}/${path.join('/')}${req.nextUrl.search}`
    try {
      const resp = await fetch(targetUrl, init)
      const buf = await resp.arrayBuffer()
      const resHeaders = new Headers(resp.headers)
      resHeaders.set('Access-Control-Allow-Origin', '*')
      resHeaders.delete('content-encoding')
      return new NextResponse(buf, { status: resp.status, statusText: resp.statusText, headers: resHeaders })
    } catch (e: any) {
      errors.push(`${targetUrl} → ${String(e)}`)
      continue
    }
  }
  return NextResponse.json({ ok: false, error: 'proxy_error', tried: candidates, messages: errors }, { status: 502 })
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params.path)
}


