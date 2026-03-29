# Replace tRPC with Hono OpenAPI + React Query

## Goal

Remove tRPC from the stack and replace it with `@hono/zod-openapi` routes on the server and direct `@tanstack/react-query` + Hono RPC client (`hono/client`) on the frontend. Single PR, two phases.

## Motivation

- Eliminate the tRPC abstraction layer in favor of standard HTTP routes with OpenAPI schemas
- Keep end-to-end type safety via Hono's typed client
- Use React Query directly instead of through tRPC's wrapper

## Phase 1: Backend

### New dependencies

- Add `@hono/zod-openapi` to `server/package.json`

### Auth middleware

Create `server/src/auth/authMiddleware.ts` with **two** middleware variants:

**`authMiddleware` (strict):**
1. Reads the session cookie via Lucia (`lucia.readSessionCookie`)
2. Validates the session (`lucia.validateSession`)
3. Refreshes the cookie if the session is fresh
4. Sets `user` and `session` on the Hono context (`c.set("user", user)`)
5. Returns 401 JSON `{ error: "Unauthorized" }` if no valid session

**`optionalAuthMiddleware` (non-blocking):**
1. Same steps 1-4 as above
2. If no session, sets `user` and `session` to `null` and calls `next()` — never returns 401

The Hono app needs typed context variables for `user` and `session` (via `Hono<{ Variables: { user: User | null; session: Session | null } }>`).

This replaces the current `authProcedure` tRPC middleware.

### Schema conversion rules

Since GET request query parameters arrive as strings, all Zod schemas used for GET route inputs must account for this:

- `z.number()` → `z.coerce.number()` (e.g., `page` in `novels.search`)
- `z.boolean()` → `z.coerce.boolean()` if used in query params
- Bare `z.string()` inputs (e.g., `history.novelHistory`) must be wrapped in `z.object({ slug: z.string() })` — query params require named keys

POST request bodies are parsed as JSON, so their schemas remain unchanged.

### Route conversion

Each tRPC router file in `server/src/routes/` becomes a `@hono/zod-openapi` router using `OpenAPIHono`. The conversion pattern is:

| tRPC concept | Hono OpenAPI equivalent |
|---|---|
| `publicProcedure.input(schema).query()` | `GET` route with `request.query` schema |
| `publicProcedure.input(schema).mutation()` | `POST` route with `request.body` (json) schema |
| `authProcedure.input(schema).query()` | `GET` route with `authMiddleware` + `request.query` schema |
| `authProcedure.input(schema).mutation()` | `POST` route with `authMiddleware` + `request.body` schema |
| `authProcedure.query()` (no input) | `GET` route with `authMiddleware`, no input schema |
| Routes that optionally read user | `GET` route with `optionalAuthMiddleware` |

All routes are prefixed under `/api/`. Existing Zod schemas are reused (with coercion adjustments for GET routes).

#### Route mapping

**novels** (`server/src/routes/novels.ts`):
| tRPC procedure | HTTP | Path | Auth |
|---|---|---|---|
| `novels.search` | `GET` | `/api/novels/search` | No |
| `novels.chapters` | `GET` | `/api/novels/chapters` | No |
| `novels.chapter` | `GET` | `/api/novels/chapter` | Optional (`optionalAuthMiddleware`) |

Note: `novels.chapter` uses `ctx.user` optionally (to fetch `sentenceIndex` from history). The `page` param in `novels.search` must use `z.coerce.number()`.

**favorites** (`server/src/routes/favorites.ts`):
| tRPC procedure | HTTP | Path | Auth |
|---|---|---|---|
| `favorites.add` | `POST` | `/api/favorites` | Yes |
| `favorites.delete` | `DELETE` | `/api/favorites` | Yes |
| `favorites.read` | `GET` | `/api/favorites` | Yes |
| `favorites.isFavorite` | `GET` | `/api/favorites/is-favorite` | Yes |
| `favorites.getNovelChapter` | `GET` | `/api/favorites/novel-chapter` | Yes |

**history** (`server/src/routes/history.ts`):
| tRPC procedure | HTTP | Path | Auth |
|---|---|---|---|
| `history.getNovels` | `GET` | `/api/history/novels` | Yes |
| `history.novelHistory` | `GET` | `/api/history/novel` | Yes |
| `history.add` | `POST` | `/api/history` | Yes |
| `history.clearNovelHistory` | `DELETE` | `/api/history/novel` | Yes |
| `history.read` | `GET` | `/api/history` | Yes |

Note: `history.novelHistory` currently takes a bare `z.string()` input. This must be wrapped as `z.object({ slug: z.string() })` for query param support. `history.clearNovelHistory` uses `DELETE` with `{ slug, server }` as query params.

**settings** (`server/src/routes/settings.ts`):
| tRPC procedure | HTTP | Path | Auth |
|---|---|---|---|
| `settings.getState` | `GET` | `/api/settings` | Yes |
| `settings.update` | `POST` | `/api/settings` | Yes |
| `settings.replacementRules` | `GET` | `/api/settings/replacement-rules` | Yes |
| `settings.updateReplacementRules` | `POST` | `/api/settings/replacement-rules` | Yes |

**auth** (`server/src/routes/auth.ts` + auth handlers):
| Current | HTTP | Path | Auth |
|---|---|---|---|
| `auth.isAuthenticated` | `GET` | `/api/auth/is-authenticated` | Optional (`optionalAuthMiddleware`) |
| `googleLogin` handler | `GET` | `/api/auth/google/login` | No |
| `googleCallback` handler | `GET` | `/api/auth/google/callback` | No |
| `logout` handler | `GET` | `/api/auth/logout` | No |

### OAuth callback URL

The Google OAuth callback URL in `server/src/auth/google.ts` must be updated from `${process.env.BASE_URL}/google/callback` to `${process.env.BASE_URL}/api/auth/google/callback`.

### Server entry point

`server/src/server.ts` changes:

- Remove tRPC imports and the `/trpc/*` handler
- Remove the standalone auth route handlers (`/logout`, `/google/login`, `/google/callback`) — these move into the auth OpenAPI router
- Import each OpenAPI router and mount them on the Hono app
- API routes must be mounted **before** the SPA fallback (`app.get("*", ...)`) to prevent the catch-all from intercepting API requests
- Export the app type for the Hono client: `export type AppType = typeof app`

### Response format

All routes return JSON responses (via `c.json()`). Response schemas are defined with Zod for OpenAPI compliance, matching the current return types.

### Error handling

- Auth middleware returns `c.json({ error: "Unauthorized" }, 401)`
- Validation errors are handled automatically by `@hono/zod-openapi` (returns 400 with details)
- Application errors return appropriate status codes with `c.json({ error: message }, statusCode)`

## Phase 2: Frontend

### Hono RPC client

Create `client/src/api/client.ts`:

- Import `hc` from `hono/client` and `AppType` from the server
- Export a typed client instance: `export const api = hc<AppType>("/")`

### Query keys

Create `client/src/api/queryKeys.ts` with key factories for cache management:

```ts
export const novelKeys = {
  search: (params: { search: string; page: number; server: string }) =>
    ["novels", "search", params] as const,
  chapters: (params: { slug: string; server: string }) =>
    ["novels", "chapters", params] as const,
  chapter: (params: { novel: string; chapter: string; server: string }) =>
    ["novels", "chapter", params] as const,
};

export const favoriteKeys = {
  all: () => ["favorites"] as const,
  isFavorite: (params: { slug: string; server: string }) =>
    ["favorites", "isFavorite", params] as const,
  novelChapter: (params: { slug: string }) =>
    ["favorites", "novelChapter", params] as const,
};

export const historyKeys = {
  novels: () => ["history", "novels"] as const,
  novel: (slug: string) => ["history", "novel", slug] as const,
  read: (params: { slug: string; chapter: string }) =>
    ["history", "read", params] as const,
};

export const settingsKeys = {
  state: () => ["settings"] as const,
  replacementRules: () => ["settings", "replacementRules"] as const,
};

export const authKeys = {
  isAuthenticated: () => ["auth", "isAuthenticated"] as const,
};
```

### QueryClient provider

Create `client/src/api/queryClient.ts`:

- Export a `QueryClient` instance
- Create a simple `QueryProvider` component wrapping `QueryClientProvider`

This replaces `client/src/trpc.tsx`.

### Component migration

Every file that imports from `trpc.tsx` gets updated:

| Current pattern | New pattern |
|---|---|
| `trpc.X.Y.useQuery(params)` | `useQuery({ queryKey: keys.Y(params), queryFn: () => api.path.$get({ query: params }).then(r => r.json()) })` |
| `trpc.X.Y.useMutation()` | `useMutation({ mutationFn: (data) => api.path.$post({ json: data }).then(r => r.json()) })` |
| `trpcVanilla.X.Y.query(params)` | `api.path.$get({ query: params }).then(r => r.json())` |
| `trpcVanilla.X.Y.mutate(data)` | `api.path.$post({ json: data }).then(r => r.json())` |
| `trpc.useUtils()` + `utils.X.Y.invalidate()` | `useQueryClient()` + `queryClient.invalidateQueries({ queryKey: keys.Y() })` |
| Mutation `onSuccess` with invalidation | Same pattern using `queryClient.invalidateQueries()` in `onSuccess` callback |

### Files affected (11 files)

- `client/src/pages/home.tsx`
- `client/src/pages/login.tsx`
- `client/src/pages/reader.tsx`
- `client/src/lib/use-player.ts`
- `client/src/lib/replace-rules.tsx`
- `client/src/components/reader/settings.tsx`
- `client/src/components/reader/library.tsx`
- `client/src/components/reader/history.tsx`
- `client/src/components/reader/favorite.tsx`
- `client/src/components/chapters.tsx`
- `client/src/main.tsx` (swap `TRPCProvider` for `QueryProvider`)

## Cleanup

### Files to delete

- `server/src/trpc.ts`
- `server/src/router.ts`
- `server/src/auth/authProcedure.ts`
- `client/src/trpc.tsx`

### Dependencies to remove

- `@trpc/server` (server)
- `@trpc/client` (client)
- `@trpc/react-query` (client)

### Dependencies to add

- `@hono/zod-openapi` (server)
- `hono` (client — needed for `hono/client`'s `hc` function)

## Out of scope

- Swagger/Scalar UI for the OpenAPI spec
- Changing the Prisma schema
- Changing auth logic (Lucia/Arctic)
- Changing UI components beyond swapping API calls
- Changing Zustand stores
