import crypto from 'crypto'

// ─── Bluesky ──────────────────────────────────────────────────────────────────

async function blueskyAuth(): Promise<{ accessJwt: string; did: string } | null> {
  if (!process.env.BLUESKY_IDENTIFIER || !process.env.BLUESKY_APP_PASSWORD) return null
  try {
    const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: process.env.BLUESKY_IDENTIFIER,
        password: process.env.BLUESKY_APP_PASSWORD,
      }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function postToBluesky(title: string, url: string, storyUrl: string): Promise<void> {
  const session = await blueskyAuth()
  if (!session) return

  // Build text — max 300 chars
  const tag = '#Crypto #CryptoNews'
  const base = `📰 ${title}\n\n${storyUrl}\n\n${tag}`
  const text = base.length <= 300 ? base : `📰 ${title.slice(0, 200)}…\n\n${storyUrl}\n\n${tag}`

  // Build facet so the story URL is a clickable link
  const encoder = new TextEncoder()
  const textBytes = encoder.encode(text)
  const urlBytes = encoder.encode(storyUrl)
  let urlStart = -1
  for (let i = 0; i <= textBytes.length - urlBytes.length; i++) {
    if (urlBytes.every((b, j) => textBytes[i + j] === b)) { urlStart = i; break }
  }

  const record: Record<string, unknown> = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: new Date().toISOString(),
  }
  if (urlStart !== -1) {
    record.facets = [{
      index: { byteStart: urlStart, byteEnd: urlStart + urlBytes.length },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: storyUrl }],
    }]
  }

  try {
    await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
    })
  } catch (e) {
    console.error('Bluesky post error:', e)
  }
}

// ─── Twitter / X ──────────────────────────────────────────────────────────────

function oauthSign(method: string, url: string, params: Record<string, string>, consumerSecret: string, tokenSecret: string): string {
  const sorted = Object.keys(params).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
  const base = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sorted)}`
  const key = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
  return crypto.createHmac('sha1', key).update(base).digest('base64')
}

export async function postToTwitter(title: string, storyUrl: string): Promise<void> {
  if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET ||
      !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) return

  const tweetUrl = 'https://api.twitter.com/2/tweets'
  const text = `📰 ${title.slice(0, 200)}\n\n${storyUrl}\n\n#Crypto #CryptoNews #Bitcoin`

  const oauthParams: Record<string, string> = {
    oauth_consumer_key:     process.env.TWITTER_API_KEY,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        Math.floor(Date.now() / 1000).toString(),
    oauth_token:            process.env.TWITTER_ACCESS_TOKEN,
    oauth_version:          '1.0',
  }

  const sig = oauthSign('POST', tweetUrl, oauthParams,
    process.env.TWITTER_API_SECRET,
    process.env.TWITTER_ACCESS_TOKEN_SECRET)

  const authHeader = 'OAuth ' + Object.entries({ ...oauthParams, oauth_signature: sig })
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ')

  try {
    await fetch(tweetUrl, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch (e) {
    console.error('Twitter post error:', e)
  }
}

// ─── Combined ─────────────────────────────────────────────────────────────────

export async function announceStory(title: string, url: string, storyId: string): Promise<void> {
  const storyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/story/${storyId}`
  await Promise.allSettled([
    postToBluesky(title, url, storyUrl),
    postToTwitter(title, storyUrl),
  ])
}
