
# LLK9 Astro Dashboard

A modern web application for **Leash Legacy K9 Training** — combining a public-facing marketing site with an interactive trainer dashboard for managing dogs and training sessions.

## Tech Stack

| Layer            | Technology                        |
| ---------------- | --------------------------------- |
| Framework        | Astro 4                           |
| Interactive UI   | Vue 4 (via `@astrojs/vue`)        |
| Styling          | Tailwind CSS 3 + Typography plugin|
| State Management | Pinia 2                           |
| Language         | TypeScript 5                      |
| Runtime          | Node 20                           |
| Containerization | Docker (Alpine)                   |

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

The dev server starts at <http://localhost:4321>.

### Docker Development

```bash
docker compose -f docker-compose.dev.yml up --build
```

Same URL — Docker uses file polling (`CHOKIDAR_USEPOLLING`) so hot reload works inside the container.

### Available Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start Astro dev server with HMR      |
| `npm run build`     | Production build to `dist/`          |
| `npm run preview`   | Preview the production build locally |

## Project Structure

```text
src/
├── components/
│   ├── app/            # Dashboard Vue components (Sidebar, DogPanel, modals, etc.)
│   ├── sections/       # Marketing page sections (Astro components)
│   ├── providers/      # PiniaProvider for state initialization
│   └── ui/             # Reusable UI primitives (Button, Modal, Toast)
├── pages/              # File-based routing
│   ├── index.astro     # Home / marketing landing page
│   ├── app.astro       # Trainer dashboard (Vue SPA)
│   ├── dogs.astro      # Dogs showcase
│   ├── programs/       # Training program detail pages
│   └── guides/         # Training guide pages
├── layouts/            # MainLayout, Header, Footer, Navigation, Hero
├── stores/             # Pinia stores (dogStore, sessionStore, uiStore)
├── lib/                # Utilities (dates, ID generation, storage stubs)
├── types/              # TypeScript interfaces (Dog, Session)
├── data/               # Static data (programs list)
└── styles/             # Global CSS (Tailwind directives)
```

## Routes

### Public Marketing Site

| Route                      | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `/`                        | Landing page with hero, programs, about, certifications |
| `/dogs`                    | Dogs showcase                                           |
| `/certifications`          | Trainer certifications                                  |
| `/newsletter`              | Newsletter signup                                       |
| `/training-notes`          | Training notes                                          |
| `/programs/puppy`          | Puppy Starter program                                   |
| `/programs/5-day-bootcamp` | 5-Day Bootcamp program                                  |
| `/programs/handlers-course`| Handler's Coaching Course                               |
| `/programs/off-leash`      | Off-Leash Freedom program                               |
| `/guides/puppy`            | Puppy training guide                                    |
| `/guides/crate-training`   | Crate training guide                                    |
| `/guides/reactive-dog`     | Reactive dog guide                                      |

### Trainer Dashboard

| Route  | Description                                              |
| ------ | -------------------------------------------------------- |
| `/app` | Interactive Vue dashboard for managing dogs and sessions |

The dashboard lets trainers:

- **Manage dogs** — add dogs with name, breed, and behavior tags (e.g. "reactive", "high-drive")
- **Log training sessions** — record session type (Private, Evaluation, Board & Train, Group), focus area, observations, and next steps
- **Track progress** — view session history per dog, sorted by most recent

## Architecture

The project uses a **hybrid rendering** approach:

- **Marketing pages** are pure Astro components — static HTML/CSS with zero client-side JavaScript for fast loading and SEO.
- **Dashboard (`/app`)** is a Vue SPA wrapped in an Astro page, using Pinia for state management and interactive Vue components.

### State Management (Pinia Stores)

| Store          | Purpose                                        |
| -------------- | ---------------------------------------------- |
| `dogStore`     | Dog list, active dog selection, add/manage dogs|
| `sessionStore` | Training sessions, filtered by dog             |
| `uiStore`      | Sidebar toggle, dark mode, modals, toasts      |

### Data Models

**Dog** — `id`, `clientId`, `name`, `breed`, `tags[]`

**Session** — `id`, `dogId`, `date`, `type`, `focus`, `observations`, `nextSteps`, `tags[]`

## Editing & Adding Content

### Adding a New Marketing Page

1. Create a `.astro` file in `src/pages/` (e.g. `src/pages/my-page.astro`)
2. Import and use `MainLayout` for consistent header/footer:

   ```astro
   ---
   import MainLayout from '../layouts/MainLayout.astro';
   ---
   <MainLayout title="My Page">
     <section class="py-16 px-6">
       <!-- your content -->
     </section>
   </MainLayout>
   ```

3. The page is automatically available at `/my-page`.

### Adding a New Dashboard Component

1. Create a `.vue` file in `src/components/app/`
2. Import it inside `AppShell.vue` or the relevant parent component
3. Access Pinia stores with `useDogStore()`, `useSessionStore()`, or `useUiStore()`

### Modifying Styles

All styling uses **Tailwind utility classes** directly in component templates. Global styles live in `src/styles/global.css`. Dark mode is supported via Tailwind's `dark:` prefix throughout all components.

### Path Aliases

Use `@/` to reference the `src/` directory in imports:

```ts
import { useDogStore } from '@/stores/dogStore';
```

## Storage & Backend

The `src/lib/storage/` directory contains stub implementations for:

- **IndexedDB** (`indexedDb.js`) — local persistence (not yet connected)
- **Server sync** (`sync.js`) — remote API sync (not yet connected)

Currently all data lives in Pinia's in-memory state and resets on page reload. These stubs are ready to be wired up to a backend.

## Docker

**Development container** (`dockerfile.dev`):

- Based on `node:20-alpine`
- Runs `npm run dev` with `--host 0.0.0.0` for container access
- Source is volume-mounted for live reload

```bash
# Build and start
docker compose -f docker-compose.dev.yml up --build

# Stop
docker compose -f docker-compose.dev.yml down
```

## SEO & Analytics

- **Google Tag Manager** — `GTM-5RXLK7LG`
- **Google Analytics** — `G-3JJ0J7K2WL`
- **Schema.org** structured data on training program pages
- **Open Graph & Twitter Card** meta tags for social sharing

## GitHub Automation

- **Release Please** — automated versioning and changelog generation
- **PR workflows** — CI snapshot and diff comment workflows on pull requests
