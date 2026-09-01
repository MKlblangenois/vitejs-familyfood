# Tablee

**Your kitchen companion.** Tablee is a progressive web app (PWA) for planning meals, storing recipes, and building collaborative shopping lists. It works on your phone, tablet, and desktop — and can be installed to your home screen for an app-like experience that works offline.

## Features

- **Recipes** — Create, edit, and browse recipes with ingredients, steps, prep/cook times, and serving scaling.
- **Shopping lists** — Build shared shopping lists with realtime sync, so everyone in your household sees updates instantly.
- **Add recipe to list** — Add a recipe's ingredients to a shopping list with automatic serving scaling and merging of duplicate items.
- **Authentication** — Email/password sign-up, sign-in, password reset, and profile management via Supabase Auth.
- **Image upload** — Attach photos to recipes with client-side compression before upload to Supabase Storage.
- **Progressive Web App** — Installable, offline-capable app shell with a network status indicator and mobile safe-area support.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [React 19](https://react.dev) + [Vite 8](https://vite.dev) + [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Routing | [React Router 7](https://reactrouter.com) |
| Data fetching | [TanStack Query 5](https://tanstack.com/query) |
| Forms & validation | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Backend | [Supabase](https://supabase.com) (Postgres, Auth, Storage, Realtime) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) + Workbox |
| Testing | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) |
| Linting | [Oxlint](https://oxc.rs/docs/guide/usage/linter) |

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project credentials:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

You can find both values in the Supabase dashboard under **Project Settings → API**.

### 3. Set up the database

The schema lives in `supabase/migrations/`. Apply it to your Supabase project with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref your-project-ref
supabase db push
```

This creates the tables (`profiles`, `recipes`, `shopping_lists`, and related tables), row-level security policies, indexes, updated-at triggers, seed data, storage buckets, and realtime publication.

> **Note:** The migrations assume you have enabled Supabase Auth with email/password. Storage buckets and realtime are configured in the final migrations.

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:5173.

## Development Workflow

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |
| `npm run test` | Run the Vitest test suite |

### PWA in development

The service worker is enabled in dev via `devOptions.enabled` so you can test offline behavior and the install prompt while developing. The service worker registers automatically on page load.

## PWA Configuration

The PWA is configured in `vite.config.ts` via `vite-plugin-pwa`:

- **Manifest** — `name`, `short_name`, `description`, `start_url`, `display: "standalone"`, theme/background colors, and icons (192×192, 512×512, and a 512×512 maskable icon).
- **Icons** — Generated PNGs live in `public/icons/` (source SVGs included). The maskable icon uses a full-bleed background so it renders correctly inside OS icon masks.
- **Service worker** — Uses Workbox `generateSW` with:
  - **Precache** of the app shell (HTML, JS, CSS) and static assets, so the app loads offline.
  - **Cache-first** for images and fonts (`static-assets` cache).
  - **Network-first navigation** with a fallback to the cached `index.html`, so any route renders the offline shell.
  - Supabase API calls are intentionally **not** cached — they require a network connection.
- **Registration** — `registerType: 'autoUpdate'`; the service worker is registered automatically by the plugin.

### Offline behavior

When offline, the app shell (layout, bottom nav, header) still renders from the service worker cache. Pages show their existing loading/error states, and a **network status banner** appears at the top of the screen when the connection drops, clearing automatically when you're back online.

### Safe areas & standalone mode

- The viewport uses `viewport-fit=cover`, and the bottom nav / top nav respect `env(safe-area-inset-*)` so content isn't hidden behind notches or the home indicator.
- `@media (display-mode: standalone)` styles ensure the app fills the viewport when installed.

## Desktop Layout

On larger screens the bottom navigation becomes a top bar (tablet) and then a fixed left sidebar (desktop), with the main content constrained to a centered `max-w-7xl` container. All pages are mobile-first and scale to desktop.

## Deployment

### Build

```bash
npm run build
```

The output is written to `dist/`, including the generated `manifest.webmanifest`, `sw.js`, and icons.

### Hosting

The app is a static site — deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.). Ensure the host serves `index.html` as the fallback for client-side routing (SPA rewrites).

### Supabase

- Keep your Supabase project's **publishable key** in the `VITE_SUPABASE_PUBLISHABLE_KEY` env var at build time.
- Apply migrations with `supabase db push` before deploying.
- Enable the **Realtime** extension for shopping-list sync (configured in `supabase/migrations/20260831000009_realtime.sql`).

### PWA checklist

After deploying, verify:

1. The site is served over HTTPS (required for service workers).
2. `manifest.webmanifest` and `sw.js` are reachable.
3. The app can be installed ("Add to Home Screen" / browser install prompt).
4. The app shell loads when offline.

## Project Structure

```
src/
  features/          # Feature modules (auth, recipes, shopping-lists, profile)
    <feature>/
      components/    # Feature-specific components
      hooks/         # Data-fetching hooks (TanStack Query)
      lib/           # Pure logic (serving scaling, image upload, etc.)
      pages/         # Route-level pages
      types.ts       # Feature types
  shared/
    components/      # Shared UI (AppShell, NetworkStatus, AuthLayout, TextInput)
    lib/             # Shared utilities (Supabase client)
  test/              # Test setup and mocks
supabase/
  migrations/        # Database schema, RLS, storage, realtime
  tests/             # RLS tests
```

## Testing

```bash
npm run test
```

Tests use Vitest with Testing Library and jsdom. The Supabase client is mocked in `src/test/supabaseMock.ts`. Run a single file with:

```bash
npm run test -- src/features/recipes/pages/RecipesPage.test.tsx
```
