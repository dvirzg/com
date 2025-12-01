-- Create tweets table
create table if not exists tweets (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table tweets enable row level security;

-- Policies
create policy "Public read access"
  on tweets for select
  using (true);

create policy "Admin insert access"
  on tweets for insert
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

create policy "Admin update access"
  on tweets for update
  using (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

create policy "Admin delete access"
  on tweets for delete
  using (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

