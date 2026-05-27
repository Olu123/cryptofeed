export type UserRole = 'user' | 'moderator' | 'admin'
export type StoryStatus = 'pending' | 'approved' | 'rejected' | 'debunked' | 'graveyard'
export type VoteType = 'up' | 'down'
export type StoryCategory =
  | 'bitcoin' | 'ethereum' | 'defi' | 'nft' | 'regulation'
  | 'exchange' | 'layer2' | 'solana' | 'altcoin' | 'security'
  | 'macro' | 'adoption' | 'other'
export type NewsType = 'alpha' | 'fundamental' | 'technical' | 'regulatory' | 'social' | 'fud' | 'noise'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  karma: number
  is_banned: boolean
  is_pro: boolean
  twitter_handle: string | null
  bluesky_handle: string | null
  alpha_count: number
  prediction_accuracy: number
  wallet_address: string | null
  created_at: string
}

export interface Source {
  id: string
  name: string
  domain: string
  logo_url: string | null
  language: string
  credibility_score: number
  is_featured: boolean
  twitter_handle: string | null
  bluesky_handle: string | null
}

export interface Narrative {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  category: StoryCategory
  story_count: number
  follower_count: number
  is_active: boolean
  created_at: string
}

export interface Story {
  id: string
  title: string
  url: string
  domain: string | null
  summary: string | null
  image_url: string | null
  category: StoryCategory
  news_type: NewsType
  status: StoryStatus
  credibility_score: number
  source_id: string | null
  submitted_by: string | null
  is_auto_aggregated: boolean
  has_holding_disclosure: boolean
  disclosed_token: string | null
  upvotes: number
  downvotes: number
  comment_count: number
  view_count: number
  hot_score: number
  narrative_id: string | null
  is_sponsored: boolean
  is_pinned: boolean
  sponsor_label: string | null
  original_language: string
  translated_title: string | null
  published_at: string
  created_at: string
  // Joined
  profile?: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'karma' | 'alpha_count' | 'twitter_handle' | 'bluesky_handle'>
  source?: Pick<Source, 'name' | 'domain' | 'logo_url' | 'credibility_score'>
  narrative?: Pick<Narrative, 'title' | 'slug'>
  user_vote?: VoteType | null
}

export interface Comment {
  id: string
  story_id: string
  user_id: string
  parent_id: string | null
  content: string
  upvotes: number
  downvotes: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  profile?: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'karma' | 'role' | 'twitter_handle' | 'bluesky_handle'>
  replies?: Comment[]
  user_vote?: VoteType | null
}

export interface Prediction {
  id: string
  story_id: string
  user_id: string
  content: string
  category: string | null
  outcome: 'pending' | 'correct' | 'incorrect' | 'cancelled'
  resolve_by: string | null
  upvotes: number
  created_at: string
  profile?: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'prediction_accuracy'>
}

export interface HoldingDisclosure {
  id: string
  user_id: string
  token: string
  position: string | null
  is_verified: boolean
}

export interface ModerationLog {
  id: string
  moderator_id: string
  action: string
  target_type: string | null
  target_id: string | null
  reason: string | null
  created_at: string
  moderator?: Pick<Profile, 'username' | 'display_name'>
}

// Feed filter options
export interface FeedFilters {
  sort?: 'hot' | 'new' | 'top'
  category?: StoryCategory
  newsType?: NewsType
  language?: string
  narrative?: string
  timeframe?: '24h' | '7d' | '30d' | 'all'
}
