/**
 * CryptoFeed Credibility Scoring Engine
 *
 * Credibility is computed from multiple signals:
 * - Source reputation (community-rated, 0–100)
 * - Vote ratio (upvote/(upvote+downvote))
 * - Debunk flag (community marks as false → drops to 0–20)
 * - Submitter karma tier
 * - Story age (fresh stories get a slight boost, old unverified get penalized)
 */

export function computeCredibilityScore(params: {
  sourceScore: number      // 0–100, from sources.credibility_score
  upvotes: number
  downvotes: number
  isDebunked: boolean
  submitterKarma: number
  ageHours: number
}): number {
  const { sourceScore, upvotes, downvotes, isDebunked, submitterKarma, ageHours } = params

  if (isDebunked) {
    // Debunked stories cap at 15
    return Math.min(15, Math.round(sourceScore * 0.1))
  }

  const totalVotes = upvotes + downvotes
  const voteRatio = totalVotes > 0 ? upvotes / totalVotes : 0.5
  const voteScore = voteRatio * 100

  // Karma bonus: log scale, max +10 points
  const karmaBonus = Math.min(10, Math.log10(Math.max(submitterKarma + 1, 1)) * 3)

  // Age penalty: if story is > 48h old with low votes, slight penalty
  const agePenalty = ageHours > 48 && totalVotes < 3 ? 5 : 0

  const raw = (
    sourceScore    * 0.45 +
    voteScore      * 0.35 +
    karmaBonus     * 0.20
  ) - agePenalty

  return Math.max(0, Math.min(100, Math.round(raw)))
}

export function credibilityLabel(score: number): {
  label: string
  color: string
  bg: string
} {
  if (score >= 80) return { label: 'High', color: 'text-green-700', bg: 'bg-green-100' }
  if (score >= 60) return { label: 'Medium', color: 'text-yellow-700', bg: 'bg-yellow-100' }
  if (score >= 40) return { label: 'Low', color: 'text-orange-700', bg: 'bg-orange-100' }
  return { label: 'Suspect', color: 'text-red-700', bg: 'bg-red-100' }
}

export function hotScore(upvotes: number, downvotes: number, createdAt: Date): number {
  const ageHours = (Date.now() - createdAt.getTime()) / 3_600_000
  const net = Math.max(upvotes - downvotes, 0)
  return (net + 1) / Math.pow(ageHours + 2, 1.5)
}

export function newsTypeColor(type: string): string {
  const map: Record<string, string> = {
    alpha:       'bg-purple-100 text-purple-700',
    fundamental: 'bg-blue-100 text-blue-700',
    technical:   'bg-cyan-100 text-cyan-700',
    regulatory:  'bg-red-100 text-red-700',
    social:      'bg-pink-100 text-pink-700',
    fud:         'bg-orange-100 text-orange-700',
    noise:       'bg-gray-100 text-gray-500',
  }
  return map[type] ?? 'bg-gray-100 text-gray-500'
}

export function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    bitcoin: '₿', ethereum: 'Ξ', defi: '🏦', nft: '🎨',
    regulation: '⚖️', exchange: '🔄', layer2: '⚡', solana: '◎',
    altcoin: '🪙', security: '🔒', macro: '🌍', adoption: '🚀', other: '📰',
  }
  return map[category] ?? '📰'
}
