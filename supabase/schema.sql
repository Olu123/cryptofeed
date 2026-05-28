-- ============================================================
-- CryptoVibes Database Schema
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('user', 'moderator', 'admin');
create type story_status as enum ('pending', 'approved', 'rejected', 'debunked', 'graveyard');
create type vote_type as enum ('up', 'down');
create type story_category as enum (
  'bitcoin', 'ethereum', 'defi', 'nft', 'regulation', 'exchange',
  'layer2', 'solana', 'altcoin', 'security', 'macro', 'adoption', 'other'
);
create type news_type as enum ('alpha', 'fundamental', 'technical', 'regulatory', 'social', 'fud', 'noise');
create type prediction_outcome as enum ('pending', 'correct', 'incorrect', 'cancelled');
create type moderation_action as enum (
  'approve', 'reject', 'debunk', 'graveyard', 'ban_user',
  'unban_user', 'delete_comment', 'warn_user', 'pin_story', 'unpin_story'
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  display_name    text,
  avatar_url      text,
  bio             text,
  role            user_role default 'user',
  karma           integer default 0,
  is_banned       boolean default false,
  ban_reason      text,
  is_pro          boolean default false,
  stripe_customer_id text,
  -- Social handles
  twitter_handle  text,
  bluesky_handle  text,
  -- Alpha Reporter recognition
  alpha_count     integer default 0,  -- times they broke a story first
  prediction_accuracy float default 0.0,
  -- Wallet for skin-in-game disclosure (optional)
  wallet_address  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- SOURCES (news outlets & RSS feeds)
-- ============================================================
create table public.sources (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  domain          text unique not null,
  rss_url         text,
  logo_url        text,
  language        text default 'en',
  country         text default 'US',
  credibility_score integer default 50 check (credibility_score between 0 and 100),
  total_stories   integer default 0,
  debunked_stories integer default 0,
  is_active       boolean default true,
  is_featured     boolean default false,
  description     text,
  twitter_handle  text,
  bluesky_handle  text,
  created_at      timestamptz default now()
);
alter table public.sources enable row level security;
create policy "Sources viewable by everyone" on public.sources for select using (true);

-- ============================================================
-- NARRATIVES (story threads / ongoing topics)
-- ============================================================
create table public.narratives (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  slug            text unique not null,
  description     text,
  cover_image_url text,
  category        story_category default 'other',
  story_count     integer default 0,
  follower_count  integer default 0,
  is_active       boolean default true,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.narratives enable row level security;
create policy "Narratives viewable by everyone" on public.narratives for select using (true);

-- ============================================================
-- STORIES (the core entity)
-- ============================================================
create table public.stories (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  url             text not null,
  domain          text,
  summary         text,
  image_url       text,
  category        story_category default 'other',
  news_type       news_type default 'fundamental',
  status          story_status default 'pending',
  -- Credibility
  credibility_score integer default 50 check (credibility_score between 0 and 100),
  source_id       uuid references public.sources(id),
  -- Submission
  submitted_by    uuid references public.profiles(id),
  is_auto_aggregated boolean default false,
  -- Skin-in-game: does submitter hold related token?
  has_holding_disclosure boolean default false,
  disclosed_token text,  -- e.g., "ETH", "BTC"
  -- Engagement
  upvotes         integer default 0,
  downvotes       integer default 0,
  comment_count   integer default 0,
  view_count      integer default 0,
  hot_score       float default 0.0,
  -- Narrative threading
  narrative_id    uuid references public.narratives(id),
  -- Monetization
  is_sponsored    boolean default false,
  is_pinned       boolean default false,
  sponsor_label   text,
  -- Moderation
  flagged_count   integer default 0,
  moderator_note  text,
  reviewed_by     uuid references public.profiles(id),
  reviewed_at     timestamptz,
  -- Translation
  original_language text default 'en',
  translated_title text,
  translated_summary text,
  -- Timestamps
  published_at    timestamptz default now(),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index stories_hot_score_idx on public.stories(hot_score desc);
create index stories_status_idx on public.stories(status);
create index stories_category_idx on public.stories(category);
create index stories_narrative_idx on public.stories(narrative_id);
create index stories_url_idx on public.stories(url);
create index stories_title_trgm on public.stories using gin(title gin_trgm_ops);
alter table public.stories enable row level security;
create policy "Approved stories visible to all" on public.stories
  for select using (status = 'approved' or status = 'graveyard' or auth.uid() = submitted_by);
create policy "Authenticated users can submit" on public.stories
  for insert with check (auth.uid() is not null);
create policy "Submitters can update own pending stories" on public.stories
  for update using (auth.uid() = submitted_by and status = 'pending');

-- ============================================================
-- VOTES
-- ============================================================
create table public.votes (
  id              uuid primary key default uuid_generate_v4(),
  story_id        uuid references public.stories(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  vote            vote_type not null,
  created_at      timestamptz default now(),
  unique(story_id, user_id)
);
alter table public.votes enable row level security;
create policy "Users can view votes" on public.votes for select using (true);
create policy "Authenticated users can vote" on public.votes for insert with check (auth.uid() = user_id);
create policy "Users can change own vote" on public.votes for update using (auth.uid() = user_id);
create policy "Users can remove own vote" on public.votes for delete using (auth.uid() = user_id);

-- ============================================================
-- COMMENTS
-- ============================================================
create table public.comments (
  id              uuid primary key default uuid_generate_v4(),
  story_id        uuid references public.stories(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  parent_id       uuid references public.comments(id) on delete cascade,
  content         text not null check (length(content) between 1 and 5000),
  upvotes         integer default 0,
  downvotes       integer default 0,
  is_deleted      boolean default false,
  flagged_count   integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index comments_story_idx on public.comments(story_id);
create index comments_parent_idx on public.comments(parent_id);
alter table public.comments enable row level security;
create policy "Comments viewable by everyone" on public.comments for select using (true);
create policy "Authenticated users can comment" on public.comments
  for insert with check (auth.uid() = user_id and auth.uid() is not null);
create policy "Users can update own comments" on public.comments
  for update using (auth.uid() = user_id);

-- ============================================================
-- COMMENT VOTES
-- ============================================================
create table public.comment_votes (
  id          uuid primary key default uuid_generate_v4(),
  comment_id  uuid references public.comments(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  vote        vote_type not null,
  created_at  timestamptz default now(),
  unique(comment_id, user_id)
);
alter table public.comment_votes enable row level security;
create policy "Comment votes viewable" on public.comment_votes for select using (true);
create policy "Auth users can vote on comments" on public.comment_votes
  for insert with check (auth.uid() = user_id);
create policy "Users update own comment vote" on public.comment_votes
  for update using (auth.uid() = user_id);
create policy "Users delete own comment vote" on public.comment_votes
  for delete using (auth.uid() = user_id);

-- ============================================================
-- HOLDINGS DISCLOSURES (skin-in-the-game)
-- ============================================================
create table public.holdings_disclosures (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  token       text not null,        -- e.g., "BTC", "ETH", "SOL"
  position    text,                 -- "long", "short", "neutral"
  is_verified boolean default false, -- verified via wallet connect
  created_at  timestamptz default now(),
  unique(user_id, token)
);
alter table public.holdings_disclosures enable row level security;
create policy "Disclosures viewable by all" on public.holdings_disclosures for select using (true);
create policy "Users manage own disclosures" on public.holdings_disclosures
  for all using (auth.uid() = user_id);

-- ============================================================
-- PREDICTIONS (community forecasting — no money, just karma)
-- ============================================================
create table public.predictions (
  id            uuid primary key default uuid_generate_v4(),
  story_id      uuid references public.stories(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  content       text not null check (length(content) between 10 and 500),
  category      text,               -- "price", "regulatory", "adoption", "technical"
  outcome       prediction_outcome default 'pending',
  resolve_by    timestamptz,        -- when to judge it
  resolved_at   timestamptz,
  resolved_by   uuid references public.profiles(id),
  upvotes       integer default 0,
  created_at    timestamptz default now()
);
alter table public.predictions enable row level security;
create policy "Predictions viewable by all" on public.predictions for select using (true);
create policy "Auth users can predict" on public.predictions
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- NARRATIVE FOLLOWERS
-- ============================================================
create table public.narrative_followers (
  narrative_id  uuid references public.narratives(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key(narrative_id, user_id)
);
alter table public.narrative_followers enable row level security;
create policy "Followers viewable" on public.narrative_followers for select using (true);
create policy "Users follow/unfollow" on public.narrative_followers
  for all using (auth.uid() = user_id);

-- ============================================================
-- MODERATION LOG
-- ============================================================
create table public.moderation_logs (
  id            uuid primary key default uuid_generate_v4(),
  moderator_id  uuid references public.profiles(id),
  action        moderation_action not null,
  target_type   text,               -- 'story', 'comment', 'user'
  target_id     uuid,
  reason        text,
  created_at    timestamptz default now()
);
alter table public.moderation_logs enable row level security;
create policy "Mods can view logs" on public.moderation_logs
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

-- ============================================================
-- RSS FEEDS (aggregation config)
-- ============================================================
create table public.rss_feeds (
  id            uuid primary key default uuid_generate_v4(),
  source_id     uuid references public.sources(id),
  feed_url      text unique not null,
  last_fetched  timestamptz,
  fetch_count   integer default 0,
  error_count   integer default 0,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Hot score formula: (upvotes - downvotes + 1) / (age_hours + 2)^1.5
create or replace function public.compute_hot_score(
  upvotes int, downvotes int, created_at timestamptz
) returns float language plpgsql as $$
declare
  age_hours float;
  net_votes float;
begin
  age_hours := extract(epoch from (now() - created_at)) / 3600.0;
  net_votes := greatest(upvotes - downvotes, 0)::float;
  return (net_votes + 1.0) / power(age_hours + 2.0, 1.5);
end;
$$;

-- Update hot score on vote
create or replace function public.refresh_story_hot_score()
returns trigger language plpgsql as $$
begin
  update public.stories
  set hot_score = public.compute_hot_score(upvotes, downvotes, created_at),
      updated_at = now()
  where id = coalesce(new.story_id, old.story_id);
  return new;
end;
$$;
create trigger story_votes_hot_score
  after insert or update or delete on public.votes
  for each row execute procedure public.refresh_story_hot_score();

-- Update vote counts on stories
create or replace function public.update_story_vote_counts()
returns trigger language plpgsql as $$
begin
  update public.stories set
    upvotes   = (select count(*) from public.votes where story_id = coalesce(new.story_id, old.story_id) and vote = 'up'),
    downvotes = (select count(*) from public.votes where story_id = coalesce(new.story_id, old.story_id) and vote = 'down')
  where id = coalesce(new.story_id, old.story_id);
  return new;
end;
$$;
create trigger story_vote_counts
  after insert or update or delete on public.votes
  for each row execute procedure public.update_story_vote_counts();

-- Update comment count on story
create or replace function public.update_comment_count()
returns trigger language plpgsql as $$
begin
  update public.stories set
    comment_count = (select count(*) from public.comments where story_id = coalesce(new.story_id, old.story_id) and not is_deleted)
  where id = coalesce(new.story_id, old.story_id);
  return new;
end;
$$;
create trigger story_comment_count
  after insert or delete on public.comments
  for each row execute procedure public.update_comment_count();

-- Update narrative story count
create or replace function public.update_narrative_count()
returns trigger language plpgsql as $$
begin
  if new.narrative_id is not null then
    update public.narratives set
      story_count = (select count(*) from public.stories where narrative_id = new.narrative_id and status = 'approved'),
      updated_at = now()
    where id = new.narrative_id;
  end if;
  return new;
end;
$$;
create trigger narrative_story_count
  after insert or update on public.stories
  for each row execute procedure public.update_narrative_count();

-- ============================================================
-- SEED: Initial RSS Sources (50+ feeds)
-- ============================================================
insert into public.sources (name, domain, rss_url, language, credibility_score, is_featured) values
('CoinDesk', 'coindesk.com', 'https://www.coindesk.com/arc/outboundfeeds/rss/', 'en', 82, true),
('Cointelegraph', 'cointelegraph.com', 'https://cointelegraph.com/rss', 'en', 78, true),
('The Block', 'theblock.co', 'https://www.theblock.co/rss.xml', 'en', 85, true),
('Decrypt', 'decrypt.co', 'https://decrypt.co/feed', 'en', 80, true),
('Bitcoin Magazine', 'bitcoinmagazine.com', 'https://bitcoinmagazine.com/.rss/full/', 'en', 76, true),
('CryptoSlate', 'cryptoslate.com', 'https://cryptoslate.com/feed/', 'en', 72, false),
('Bitcoinist', 'bitcoinist.com', 'https://bitcoinist.com/feed/', 'en', 65, false),
('NewsBTC', 'newsbtc.com', 'https://www.newsbtc.com/feed/', 'en', 62, false),
('AMBCrypto', 'ambcrypto.com', 'https://ambcrypto.com/feed/', 'en', 60, false),
('BeInCrypto', 'beincrypto.com', 'https://beincrypto.com/feed/', 'en', 63, false),
('Blockworks', 'blockworks.co', 'https://blockworks.co/feed', 'en', 79, true),
('DeFi Llama Blog', 'blog.defillama.com', 'https://blog.defillama.com/rss/', 'en', 77, false),
('Ethereum Foundation Blog', 'blog.ethereum.org', 'https://blog.ethereum.org/feed.xml', 'en', 95, true),
('Bitcoin.org News', 'bitcoin.org', 'https://bitcoin.org/en/rss/releases.rss', 'en', 90, true),
('Messari Research', 'messari.io', 'https://messari.io/rss/news.xml', 'en', 88, true),
('CryptoCompare', 'cryptocompare.com', 'https://www.cryptocompare.com/api/data/news/?feeds=cryptocompare', 'en', 70, false),
('Bankless', 'bankless.com', 'https://www.bankless.com/rss', 'en', 74, false),
('Unchained Podcast', 'unchainedpodcast.com', 'https://unchainedpodcast.com/feed/', 'en', 75, false),
('The Defiant', 'thedefiant.io', 'https://thedefiant.io/feed', 'en', 76, false),
('Protos', 'protos.com', 'https://protos.com/feed/', 'en', 71, false),
('CoinGape', 'coingape.com', 'https://coingape.com/feed/', 'en', 58, false),
('U.Today', 'u.today', 'https://u.today/rss', 'en', 60, false),
('Cryptobriefing', 'cryptobriefing.com', 'https://cryptobriefing.com/feed/', 'en', 68, false),
('ZyCrypto', 'zycrypto.com', 'https://zycrypto.com/feed/', 'en', 55, false),
('Crypto News', 'crypto.news', 'https://crypto.news/feed/', 'en', 65, false),
-- Korean sources (translated)
('CoinNess KR', 'coinness.com', 'https://coinness.com/rss', 'ko', 65, false),
('TokenPost KR', 'tokenpost.kr', 'https://tokenpost.kr/rss', 'ko', 62, false),
-- Japanese
('CoinPost JP', 'coinpost.jp', 'https://coinpost.jp/?feed=rss2', 'ja', 68, false),
-- Portuguese (Brazil)
('Livecoins BR', 'livecoins.com.br', 'https://livecoins.com.br/feed/', 'pt', 60, false),
('Portal do Bitcoin', 'portaldobitcoin.com.br', 'https://portaldobitcoin.uol.com.br/feed/', 'pt', 62, false);

