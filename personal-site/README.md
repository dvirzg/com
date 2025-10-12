# Personal Website

A minimal, modern personal website built with React, TailwindCSS, Framer Motion, and Supabase.

## Features

- **Liquid Glass Design**: Subtle translucency and depth inspired by Apple's design language
- **Dark/Light Mode**: Automatic theme detection with manual toggle
- **Authentication**: Supabase magic link authentication
- **Notes System**: Dynamic markdown notes fetched from Supabase
- **Admin Editor**: Markdown editor restricted to admin users
- **Smooth Animations**: Framer Motion shared layout transitions
- **Responsive**: Mobile-first design

## Tech Stack

- **React 18** with Vite
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Supabase** for auth and database
- **React Router** for routing
- **React Markdown** for rendering notes

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable components
│   └── Navbar.jsx   # Fixed navbar with animated tabs
├── contexts/        # React contexts
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
├── lib/             # Utilities
│   └── supabase.js  # Supabase client
├── pages/           # Page components
│   ├── Home.jsx     # Landing page
│   ├── About.jsx    # About page
│   ├── Notes.jsx    # Notes listing
│   ├── Note.jsx     # Single note view
│   ├── Login.jsx    # Login page
│   └── Editor.jsx   # Admin note editor
└── App.jsx          # Main app with routing
```

## Deployment

Deploy to Vercel with one click or via CLI:

```bash
vercel
```

Don't forget to add your environment variables in Vercel project settings.

## License

MIT
