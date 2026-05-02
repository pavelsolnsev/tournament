# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # dev server on port 3000
yarn build        # production build
yarn test         # run all tests (vitest)
yarn test:watch   # vitest in watch mode
yarn lint         # ESLint
yarn lint:fix     # ESLint with auto-fix
yarn typecheck    # vue-tsc type check
yarn qa           # lint + typecheck + test + build
```

Run a single test file:
```bash
yarn test test/ratingCalc.test.ts
```

## Architecture

### Stack
- **Nuxt 3** (SSR only for `/`, rest is SPA) + **Vue 3** + **TypeScript strict**
- **MySQL** via `mysql2/promise` (pool with auto-retry on connection loss — `server/utils/db.ts`)
- **TanStack Vue Query** for client-side data fetching (registered in `app/plugins/vue-query.ts`)
- **Tailwind CSS** (dark mode via `dark:` classes, theme toggled by `.dark` on `<html>`)
- `srcDir: 'app'` — all Vue/composables/pages live under `app/`

### Directory layout

```
app/                     # Nuxt srcDir
  pages/index.vue        # single page — admin + viewer in one file
  components/
    atoms/               # primitive UI (buttons, chips, badges)
    molecules/           # composed UI (DropdownSelect, PlayerListRow, …)
    organisms/
      tournament/        # wizard steps: StepPlayers, StepTeams, StepStandings, StepVkListStartPanel
      standings/         # live standings table
      viewer/            # read-only viewer (TournamentViewer)
      vk-bot/            # VK bot UI panels
  composables/
    useTournamentWizard.ts      # main wizard state (step, players, teams, assignment)
    useTournamentState.ts       # DB sync: useFetch + debounced PUT + polling (15s when active)
    useTeamAssignment.ts        # team ↔ player mapping
    tournament-wizard/          # savedContextTypes.ts, applyServerContext.ts
    tournament-standings/       # match stats, ratings, pairing, standings calc (pure logic, tested)
    tournament-summary/         # award helpers and types for post-tournament summary
  types/tournament.ts           # shared domain types
  utils/                        # client-side helpers (teamNames, teamLogos, playerPhotoUrl, …)
  layouts/                      # default.vue, landing.vue, tournament-form.vue

server/
  api/                   # Nitro route handlers
    tournament/          # active tournament: state CRUD, finish, player-paid, vk-status/start
    tournaments/         # archive CRUD: [id].get/patch/delete, index.get
    vk/                  # VK bot webhooks: join/leave/link-event/set-team/player-paid/…
    players/             # player CRUD + rating patch + reset
    teams/               # team CRUD
    auth/                # login/logout/check (cookie admin_session = 'full' | 'limited')
    feedback/            # feedback CRUD
  middleware/
    canonical-host.ts    # redirects non-canonical hosts (www → bare, http → https)
  utils/                 # ALL server business logic lives here (no services/ or repositories/)
    db.ts                # MySQL pool + queryWithRetry (auto-retry on connection loss)
    initDb.ts            # lazy CREATE TABLE IF NOT EXISTS on first request
    vkBotAuth.ts         # validates FOOTBALL_TOKEN on all /api/vk/* requests
    saveTournamentArchive.ts       # writes finished tournament to archive tables
    persistTournamentStatePutBody.ts  # validates + normalizes PUT body before DB write
    tournamentPaidPlayers.ts       # parses VK team slots and paid player IDs
    vkStartListRequest.ts          # triggers VK list start via bot API
    vkListCloseRequest.ts          # triggers VK list close via bot API
    vkUnlinkRelinkPolicy.ts        # handles VK link/unlink edge cases
    mergeLiveCurrentMatchStatsForPersist.ts  # merges live match stats before save
    computeArchiveTournamentMvp.ts # MVP calculation for archive
    createPlayerInDb.ts            # creates a new player row

vk-bot/                  # standalone Node.js VK bot (separate package.json, see below)
test/                    # vitest unit tests (jsdom env, alias ~ → app/)
```

### Tournament state flow

The app manages a single active tournament at a time. State is a `SavedTournamentContext` JSON blob stored in MySQL (`app_state` table, key `tournament`).

1. **Admin wizard** (`useTournamentWizard`) drives 3 steps: Players → Teams → Standings.
2. `useTournamentState` syncs wizard state to DB: debounced PUT (800ms) for live edits, immediate PUT for critical actions (finish, reset).
3. During an active match (`matchStatus !== 'idle'`) the state is polled every 15s so the **viewer** (read-only mode) and other admin tabs stay in sync.
4. `SavedTournamentContext.__fullReset: true` in the PUT body signals a full reset — server deletes the row and does not persist.

### Auth

Session cookie `admin_session` holds `'full'` or `'limited'` (no JWT). Read on every SSR request by `app/plugins/admin-auth.server.ts`. `useAdminAuth()` exposes `isAdmin`, `adminRole`, and `login/logout`.

### VK Bot (`vk-bot/`)

Standalone Node.js process (plain ESM, no TypeScript, separate `package.json`). Uses **vk-io** for VK long-poll. Run with `node index.js` from `vk-bot/`.

**Architecture:**
- `index.js` — entry point: starts long-poll, heartbeat, and two polling loops (`startNotifyLoop`, `startSiteStartRequestPoll`). Has exponential-backoff restart on long-poll failure and sends admin alerts on consecutive errors.
- `src/store/eventStore.js` — in-memory store of active events (per chat `peerId`). Each event holds participants, queue, team assignments, paid marks, VK message IDs for editing.
- `src/handlers/messageNew.js` — routes text commands from chat.
- `src/handlers/messageEvent.js` — routes callback button presses.
- `src/handlers/commands/` — one file per command: `startEvent`, `closeEvent`, `addByName`, `removeByNumber`, `payByNumber`, `plusMinus`, `rdy`, `addTeamSlot`, `removeTeamSlot`, `movePlayerTeam`, `limit`, `indexByNumber`, `lastEvent`, `showMyVkAccount`, `addTestPlayers`.
- `src/handlers/callbacks/handleEventButton.js` — handles inline button clicks (join/leave/team selection).
- `src/services/footballApi/` — HTTP client that calls the Nuxt server API (`FOOTBALL_API_URL` + `FOOTBALL_TOKEN`). Functions: `registerPlayerOnFootballSite`, `removePlayerFromFootballSite`, `setPlayerTeamOnFootballSite`, `fetchFootballSiteRosterSnapshot`, `setPlayerPaidOnFootballSite`, `registerVkListLinkOnFootballSite`, `ackVkStartRequest`, `ackVkListCloseRequest`, etc.
- `src/services/siteRosterPoll.js` — polls `/api/vk/roster-snapshot` to sync site roster → bot event (grace window prevents race between join and poll).
- `src/services/siteStartRequestPoll.js` — polls `/api/tournament/vk-status` waiting for `startRequested` flag; when detected, calls `ackVkStartRequest` and starts the VK list message.
- `src/vk/` — VK message helpers: `listMessage`, `keyboard`, `sendEphemeral`, `tournamentLiveNotice`, `userNames`, etc.

**Bot ↔ Nuxt server communication:**
- Bot calls `POST /api/vk/join`, `/api/vk/leave`, `/api/vk/set-team`, `/api/vk/link-event`, `/api/vk/unlink-event`, `/api/vk/player-paid`, `/api/vk/roster-snapshot` (GET), `/api/tournament/vk-status` (GET), `/api/tournament/vk-request-start` (POST ack).
- All bot→server calls are authenticated with `FOOTBALL_TOKEN` (checked by `server/utils/vkBotAuth.ts`).

**Bot environment variables (in `vk-bot/.env`):**
```
VK_TOKEN                  # VK group API token
FOOTBALL_API_URL          # URL of the Nuxt server (e.g. http://localhost:3000)
FOOTBALL_TOKEN            # shared secret for bot→server auth
VK_ADMIN_IDS              # comma-separated VK user IDs for error alerts
```

**Self-tests:**
```bash
cd vk-bot
npm run selftest:admin    # tests admin chat commands
npm run selftest:team     # tests team mode
```

### Nuxt environment variables

```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME   # MySQL connection
NUXT_PUBLIC_VK_DEFAULT_PEER_ID           # VK chat peer_id (dev default: 2000000001)
```

### Testing

Tests live in `test/` and cover pure logic: rating calc, standings, MVP, match stats merge, player normalization. No component or API tests. Aliases `~` and `@` resolve to `app/`.

## Documentation references

- [Nuxt 3](https://nuxt.com/docs/4.x/getting-started/introduction) — SSR, routing, composables, Nitro server
- [Tailwind CSS](https://tailwindcss.com/) — utility classes, responsive prefixes, dark mode
- [TanStack Query](https://tanstack.com/) — `useQuery`, `useMutation`, cache invalidation
- [VK Dev](https://dev.vk.com/ru/guide) — VK API, long-poll, callback buttons (bot)

## Code style

### Vue SFC block order

Always put `<template>` above `<script setup>`, with optional `<style>` at the bottom.

### File size limit

ESLint enforces **400 lines max** per `.ts` / `.vue` file (blank lines and full-line comments excluded). If a file approaches this limit, split it by responsibility: extract composables, utils, or sub-components. A few legacy files may temporarily use a higher cap.

### Comments

After each logic block, add a short plain-language comment explaining **what** it does and **why** — written at a simple level so any developer can follow along ("Simple10" style). This applies to both Vue and JS/TS files.

### Component structure (Atomic Design)

- **Atoms** (`components/atoms/`): purely presentational — props and slots only, no business logic.
- **Molecules** (`components/molecules/`): groups of atoms forming one UI unit, minimal local state.
- **Organisms** (`components/organisms/<area>/`): feature sections that use composables and contain real logic. Group by domain (e.g. `tournament/`, `standings/`, `viewer/`).

### Composables

All shared, reusable logic goes in `composables/`. Do not duplicate logic across components — extract to a composable or `utils/`.

## Design rules (`.vue` files)

- **Mobile-first**: use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`). Support from 320px up.
- **Viewport fit**: short-content pages must fit on screen without scrolling — use `min-h-screen`, `flex-1`, or `h-screen` as needed.
- **Typography**: clear hierarchy (`text-sm` / `text-base` / `text-lg`). `leading-tight` for headings, `leading-normal` for body.
- **Spacing**: stick to Tailwind's 4-step scale (`p-4`, `gap-4`). Avoid one-off values like `p-7`.
- **Consistency**: reuse the same `rounded-*`, shadow level, and border style across related components.
- **Motion**: subtle transitions only (`transition-colors duration-200`). No distracting animations.
- **Cross-browser**: the layout must be stable and pixel-consistent across all modern browsers. No shifting, breaking, or unexpected scrolling on mobile.
