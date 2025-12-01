-- Create tweet_replies table
create table if not exists tweet_replies (
  id uuid default gen_random_uuid() primary key,
  tweet_id uuid references tweets(id) on delete cascade not null,
  content text not null,
  sender text,
  created_at timestamptz default now() not null,
  read boolean default false not null
);

-- Enable RLS
alter table tweet_replies enable row level security;

-- Policies
-- Public can insert replies
create policy "Public insert access"
  on tweet_replies for insert
  with check (true);

-- Admin can read replies
create policy "Admin read access"
  on tweet_replies for select
  using (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Admin can update (mark as read)
create policy "Admin update access"
  on tweet_replies for update
  using (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Admin can delete
create policy "Admin delete access"
  on tweet_replies for delete
  using (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );
