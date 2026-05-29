import { NextResponse } from 'next/server'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cryptovibes.vercel.app'
  const text = `User-agent: *
Allow: /

Sitemap: ${appUrl}/sitemap.xml`

  return new NextResponse(text, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
