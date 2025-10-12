# Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Vercel account (optional, for deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is created, go to **Project Settings** → **API**
3. Copy your **Project URL** and **anon/public key**

### 3. Create Database Table

In your Supabase project, go to the **SQL Editor** and run:

```sql
-- Create notes table
create table notes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  published boolean default false
);

-- Enable Row Level Security
alter table notes enable row level security;

-- Allow anyone to read published notes
create policy "Anyone can read published notes"
  on notes for select
  using (published = true);

-- Allow authenticated users to insert notes (you can restrict this further)
create policy "Authenticated users can insert notes"
  on notes for insert
  with check (auth.role() = 'authenticated');
```

### 4. Configure Admin User

After logging in with your email via magic link, you need to set your role to admin:

1. Go to **Authentication** → **Users** in Supabase
2. Click on your user
3. Scroll to **User Metadata** and add:
   ```json
   {
     "role": "admin",
     "name": "Your Name"
   }
   ```

### 5. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Deployment to Vercel

### 1. Install Vercel CLI (optional)

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### 3. Add Environment Variables in Vercel

In your Vercel project settings, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Features

- Dark/light mode with system preference detection
- Supabase authentication with magic links
- Markdown notes with admin-only editor
- Animated navbar with Framer Motion shared layout transitions
- Minimal, modern "liquid glass" aesthetic
- Fully responsive design

## Usage

- **Anyone** can view published notes
- **Logged-in users** see their name in the navbar
- **Admin users** can access the editor and publish notes

## Notes

- The site URL in Supabase auth settings should match your deployment URL
- For local development, add `http://localhost:5173` to your Supabase auth redirect URLs
