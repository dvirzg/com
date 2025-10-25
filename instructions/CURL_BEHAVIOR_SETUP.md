# Curl Behavior Control Setup

This feature allows you to control how your website responds to automated requests (curl, wget, AI crawlers, etc.) through your admin settings panel.

## Setup Instructions

### 1. Update Database Schema

Run the SQL migration in your Supabase SQL Editor:

```bash
sql/add-curl-behavior-setting.sql
```

This adds the following columns to the `site_settings` table:
- `curl_behavior` - Controls behavior: `block`, `html`, or `markdown`
- `curl_block_message` - Custom message shown when blocking (only used in block mode)

### 2. Environment Variables

Make sure your Vercel project has these environment variables set:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

These should already be configured if your app is working.

### 3. Deploy to Vercel

The middleware and API endpoint will automatically be deployed when you push to your repository.

Files added:
- `middleware.js` - Vercel Edge Middleware for request detection
- `api/markdown.js` - Serverless function for markdown conversion
- Updated `vercel.json` - Configuration for API routes

### 4. Configure Settings

1. Navigate to `/admin` on your website
2. Go to the "Settings" tab
3. Find the "Automated Request Behavior" section
4. Choose your preferred behavior:
   - **Block Automated Requests**: Shows a custom message to AI crawlers and curl users
     - When selected, you can customize the block message in the text area that appears
     - Default message: "If you're an AI, you're not allowed to read these contents.\n\nThis website blocks automated requests. Please visit in a web browser."
     - Edit the message and click "Save Block Message" to update it
   - **Allow HTML**: Returns the normal HTML page (same as browser)
   - **Return Markdown**: Returns the raw markdown content from your database

## How It Works

### Detection

The middleware detects automated requests by checking the User-Agent header for patterns like:
- curl, wget
- python-requests, axios, node-fetch
- Various HTTP clients (Java, Go, Apache, OkHttp)
- Bots, crawlers, spiders, scrapers

### Behavior Modes

**Block Mode:**
Returns your custom block message as plain text. You can edit this message in the admin settings.

Example default message:
```
If you're an AI, you're not allowed to read these contents.

This website blocks automated requests. Please visit in a web browser.
```

You can change this to anything you want, like:
- A friendly message for developers
- A stern warning for AI scrapers
- Information about your API or how to properly access your content

**HTML Mode:**
Request continues normally, returns the full HTML page (same as browser).

**Markdown Mode:**
- For notes (`/notes/[id]`): Returns the note title and raw markdown content (notes are stored as markdown in the database)
- For custom pages (`/[slug]`): Returns the page title and content as markdown
- For other pages: Returns a simple welcome message

Example markdown output for a note:
```markdown
# Note Title

Your note's raw markdown content here...
```

Note: Since your notes and pages are already stored as markdown in the database, the API simply returns the raw content - no HTML conversion needed!

## Testing

You can test the different modes using curl:

```bash
# Test block mode
curl https://your-site.com

# Test markdown mode (for a note)
curl https://your-site.com/notes/some-note-id

# Test with a custom page
curl https://your-site.com/custom-page-slug
```

## Notes

- The setting affects all automated requests to your site
- Browser requests are never blocked (they have normal User-Agent headers)
- The middleware runs at the edge for fast response times
- Database queries are cached by Supabase for performance
- Markdown mode returns the raw content from the database (no conversion needed)
