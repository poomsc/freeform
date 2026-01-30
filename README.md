# Freeform

A web-based infinite canvas board inspired by iOS Freeform. Built with Next.js 15, tldraw, and Supabase.

Features:
- Infinite canvas with shapes, notes, arrows, and freehand drawing
- Auto-save to cloud (Supabase)
- Export canvas as PNG snapshot
- API endpoint for iOS Scriptable widget integration
- Email/password authentication

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Canvas**: [tldraw](https://tldraw.dev) — infinite canvas library
- **Database**: [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)

## Prerequisites

- Node.js 20+ (or Bun)
- A Supabase project (free tier works)

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url> freeform
cd freeform
bun install    # or: npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public** key from Settings → API

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key-here
```

### 4. Run the database schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Paste and run the contents of `supabase/schema.sql`
4. Then paste and run `supabase/storage-policies.sql`

This creates:
- `profiles` table (with auto-generated API tokens)
- `boards` table (stores tldraw snapshots)
- `snapshots` storage bucket (public, for PNG exports)
- Trigger to auto-create a profile when a user signs up
- Row Level Security policies

### 5. Run the dev server

```bash
bun dev    # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Sign up** with email and password
2. You'll be redirected to the **board** page with a tldraw canvas
3. Draw, add shapes, notes, and arrows — changes **auto-save** every 3 seconds
4. Click **Save** to save manually
5. Click **API Token** in the header to reveal your token — use it for the Scriptable widget

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/board` | Cookie (session) | Get your latest board snapshot |
| `POST` | `/api/board` | Cookie (session) | Save board snapshot + PNG |
| `GET` | `/api/snapshot?token=YOUR_TOKEN` | Query param | Get board PNG (for widget) |

## Scriptable Widget

See [IOS_WIDGET.md](./IOS_WIDGET.md) for full instructions on setting up the iOS home screen widget using the Scriptable app.

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
4. Deploy

Your app will be live at `https://your-app.vercel.app`.

Update the Scriptable widget URL to use your Vercel domain.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              Root layout
│   ├── page.tsx                Redirect to /board or /login
│   ├── board/page.tsx          Main canvas (protected)
│   ├── login/page.tsx          Sign in
│   ├── signup/page.tsx         Sign up
│   ├── auth/callback/route.ts  OAuth callback
│   └── api/
│       ├── board/route.ts      Board CRUD API
│       └── snapshot/route.ts   PNG snapshot API (for widget)
├── components/
│   ├── board-canvas.tsx        tldraw wrapper with auto-save
│   ├── auth-form.tsx           Login/signup form
│   └── ui/                     shadcn components
└── lib/
    ├── supabase/
    │   ├── client.ts           Browser Supabase client
    │   └── server.ts           Server Supabase client
    └── utils.ts                Utility functions
```
