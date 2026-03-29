# tRPC to Hono OpenAPI Migration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace tRPC with `@hono/zod-openapi` routes on the server and direct React Query + Hono RPC client on the frontend.

**Architecture:** Two-phase migration in a single PR. Phase 1 converts all backend tRPC procedures to Hono OpenAPI routes following the open_books pattern (separate route + handler exports, `RouteHandler` typing, `stoker` helpers, flat registration in `app.ts`). Phase 2 swaps the frontend from tRPC hooks to direct React Query + Hono `hc` client.

**Tech Stack:** `@hono/zod-openapi`, `stoker`, `hono/client` (`hc`), `@tanstack/react-query`, Zod, Lucia auth

**Spec:** `docs/superpowers/specs/2026-03-29-trpc-to-hono-openapi-design.md`

**Pattern reference:** `/Users/luis/github/books/src/` (open_books repo)

---

## File Structure

### New files (server)
- `server/src/auth/authMiddleware.ts` — strict + optional auth Hono middleware
- `server/src/lib/appFactory.ts` — `AppEnv` type + `createRouter()` helper

### Modified files (server)
- `server/src/routes/novels.ts` — tRPC router → separate route/handler exports
- `server/src/routes/favorites.ts` — tRPC router → separate route/handler exports
- `server/src/routes/history.ts` — tRPC router → separate route/handler exports
- `server/src/routes/settings.ts` — tRPC router → separate route/handler exports
- `server/src/routes/auth.ts` — tRPC router → separate route/handler exports (absorbs google + logout)
- `server/src/server.ts` — remove tRPC, flat `.openapi()` registration, export AppType
- `server/src/auth/google.ts` — update callback URL + Context type
- `server/src/auth/logout.ts` — update Context type
- `server/src/auth/getAuthContext.ts` — adapt for Hono context (remove tRPC types)
- `server/package.json` — add `@hono/zod-openapi` + `stoker`, remove `@trpc/server`

### New files (client)
- `client/src/api/client.ts` — Hono `hc` typed client
- `client/src/api/queryKeys.ts` — React Query key constants
- `client/src/api/queryClient.tsx` — QueryClient + QueryProvider

### Modified files (client)
- `client/src/main.tsx` — swap TRPCProvider for QueryProvider
- `client/src/pages/home.tsx` — replace trpc hooks
- `client/src/pages/login.tsx` — replace trpc hooks
- `client/src/pages/reader.tsx` — replace trpc + trpcVanilla calls
- `client/src/lib/use-player.ts` — replace trpc hooks
- `client/src/lib/replace-rules.tsx` — replace trpc hooks
- `client/src/components/reader/settings.tsx` — replace trpc hooks
- `client/src/components/reader/library.tsx` — replace trpc + trpcVanilla calls
- `client/src/components/reader/history.tsx` — replace trpc hooks
- `client/src/components/reader/favorite.tsx` — replace trpc hooks
- `client/src/components/chapters.tsx` — replace trpc hooks
- `client/package.json` — add `hono`, remove `@trpc/client` + `@trpc/react-query`

### Deleted files
- `server/src/trpc.ts`
- `server/src/router.ts`
- `server/src/auth/authProcedure.ts`
- `client/src/trpc.tsx`

---

## Task 1: Install dependencies

**Files:**
- Modify: `server/package.json`
- Modify: `client/package.json`

- [ ] **Step 1: Add server dependencies**

```bash
cd /Users/luis/github/reader/server && bun add @hono/zod-openapi stoker
```

- [ ] **Step 2: Add client dependency**

```bash
cd /Users/luis/github/reader/client && bun add hono
```

- [ ] **Step 3: Commit**

```bash
cd /Users/luis/github/reader && git add server/package.json server/bun.lockb client/package.json client/bun.lockb
git commit -m "chore: add @hono/zod-openapi, stoker, and hono client dependencies"
```

---

## Task 2: Create app factory and auth middleware

**Files:**
- Create: `server/src/lib/appFactory.ts`
- Create: `server/src/auth/authMiddleware.ts`
- Modify: `server/src/auth/getAuthContext.ts`

- [ ] **Step 1: Create app factory with typed context**

Create `server/src/lib/appFactory.ts`:

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import type { User, Session } from "lucia";

export type AppEnv = {
  Variables: {
    user: User | null;
    session: Session | null;
  };
};

export function createRouter() {
  return new OpenAPIHono<AppEnv>();
}
```

- [ ] **Step 2: Update getAuthContext for Hono**

Replace the contents of `server/src/auth/getAuthContext.ts`:

```ts
import { lucia } from "./auth";
import type { Context } from "hono";
import type { AppEnv } from "../lib/appFactory";

export async function setAuthContext(c: Context<AppEnv>) {
  const sessionId = lucia.readSessionCookie(
    c.req.header("Cookie") ?? ""
  );

  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return;
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (session && session.fresh) {
    c.header(
      "Set-Cookie",
      lucia.createSessionCookie(session.id).serialize(),
      { append: true }
    );
  }

  if (!session) {
    c.header(
      "Set-Cookie",
      lucia.createBlankSessionCookie().serialize(),
      { append: true }
    );
  }

  c.set("session", session);
  c.set("user", user);
}
```

- [ ] **Step 3: Create auth middleware**

Create `server/src/auth/authMiddleware.ts`:

```ts
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../lib/appFactory";
import { setAuthContext } from "./getAuthContext";

export const optionalAuthMiddleware = createMiddleware<AppEnv>(
  async (c, next) => {
    await setAuthContext(c);
    await next();
  }
);

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  await setAuthContext(c);

  if (!c.get("user") || !c.get("session")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
```

- [ ] **Step 4: Commit**

```bash
cd /Users/luis/github/reader && git add server/src/lib/appFactory.ts server/src/auth/authMiddleware.ts server/src/auth/getAuthContext.ts
git commit -m "feat: add Hono app factory and auth middleware"
```

---

## Task 3: Convert novels routes

**Files:**
- Modify: `server/src/routes/novels.ts`

- [ ] **Step 1: Rewrite novels.ts with separate route + handler exports**

Replace the full contents of `server/src/routes/novels.ts`:

```ts
import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../lib/appFactory";
import { prisma } from "../db";
import { optionalAuthMiddleware } from "../auth/authMiddleware";

const URL = process.env.DATA_URL;

// --- Search ---

const SearchInput = z.object({
  search: z.string(),
  page: z.coerce.number().min(0).int(),
  server: z.string(),
});

const SearchOutput = z.object({
  results: z.array(
    z.object({
      name: z.string(),
      image: z.string(),
      slug: z.string(),
    })
  ),
  next: z.boolean(),
});

export const searchRoute = createRoute({
  method: "get",
  path: "/api/novels/search",
  request: { query: SearchInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(SearchOutput, "Search results"),
  },
});

export const searchHandler: RouteHandler<typeof searchRoute, AppEnv> = async (c) => {
  const { search, page, server } = c.req.valid("query");
  const response = await fetch(URL + `/${server}/search/${search}/${page}`);
  return c.json(await response.json(), HttpStatusCodes.OK);
};

// --- Chapters ---

const ChaptersInput = z.object({
  slug: z.string(),
  server: z.string(),
});

const ChaptersOutput = z.array(
  z.object({
    title: z.string(),
    slug: z.string(),
  })
);

export const chaptersRoute = createRoute({
  method: "get",
  path: "/api/novels/chapters",
  request: { query: ChaptersInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ChaptersOutput, "Chapter list"),
  },
});

export const chaptersHandler: RouteHandler<typeof chaptersRoute, AppEnv> = async (c) => {
  const { slug, server } = c.req.valid("query");
  const response = await fetch(URL + `/${server}/chapters/${slug}`);
  return c.json(await response.json(), HttpStatusCodes.OK);
};

// --- Chapter ---

const ChapterInput = z.object({
  novel: z.string(),
  chapter: z.string(),
  server: z.string(),
});

const ChapterOutput = z.object({
  content: z.string(),
  next: z.string().nullable(),
  prev: z.string().nullable(),
  sentenceIndex: z.number().nullable(),
});

export const chapterRoute = createRoute({
  method: "get",
  path: "/api/novels/chapter",
  middleware: [optionalAuthMiddleware],
  request: { query: ChapterInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ChapterOutput, "Chapter content"),
  },
});

export const chapterHandler: RouteHandler<typeof chapterRoute, AppEnv> = async (c) => {
  const { server, novel, chapter } = c.req.valid("query");
  const response = await fetch(
    URL + `/${server}/chapter/${novel}/${chapter}`
  );
  const result = await response.json();
  let sentenceIndex = null;

  const user = c.get("user");
  if (user) {
    const history = await prisma.history.findFirst({
      where: {
        userId: user.id,
        slug: novel,
        chapter,
      },
      select: { sentenceIndex: true },
      orderBy: { updatedAt: "desc" },
    });

    if (history) {
      sentenceIndex = history.sentenceIndex;
    }
  }

  return c.json({ ...result, sentenceIndex }, HttpStatusCodes.OK);
};
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add server/src/routes/novels.ts
git commit -m "refactor: convert novels routes to Hono OpenAPI"
```

---

## Task 4: Convert favorites routes

**Files:**
- Modify: `server/src/routes/favorites.ts`

- [ ] **Step 1: Rewrite favorites.ts**

Replace the full contents of `server/src/routes/favorites.ts`:

```ts
import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../lib/appFactory";
import { prisma } from "../db";
import { authMiddleware } from "../auth/authMiddleware";

// --- Add ---

export const addFavoriteRoute = createRoute({
  method: "post",
  path: "/api/favorites",
  middleware: [authMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            slug: z.string(),
            server: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "Favorite added" },
  },
});

export const addFavoriteHandler: RouteHandler<typeof addFavoriteRoute, AppEnv> = async (c) => {
  const { slug, server } = c.req.valid("json");
  const user = c.get("user")!;

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_slug_server: { slug, server, userId: user.id },
    },
    create: { slug, server, userId: user.id },
    update: {},
  });

  return c.json(favorite, HttpStatusCodes.OK);
};

// --- Delete ---

export const deleteFavoriteRoute = createRoute({
  method: "delete",
  path: "/api/favorites",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
      server: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "Favorite deleted" },
  },
});

export const deleteFavoriteHandler: RouteHandler<typeof deleteFavoriteRoute, AppEnv> = async (c) => {
  const { slug, server } = c.req.valid("query");
  const user = c.get("user")!;

  const favorite = await prisma.favorite.delete({
    where: {
      userId_slug_server: { slug, server, userId: user.id },
    },
  });

  return c.json(favorite, HttpStatusCodes.OK);
};

// --- Read ---

export const readFavoritesRoute = createRoute({
  method: "get",
  path: "/api/favorites",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: { description: "List of favorites" },
  },
});

export const readFavoritesHandler: RouteHandler<typeof readFavoritesRoute, AppEnv> = async (c) => {
  const user = c.get("user")!;

  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
  });

  return c.json(favs, HttpStatusCodes.OK);
};

// --- Is Favorite ---

export const isFavoriteRoute = createRoute({
  method: "get",
  path: "/api/favorites/is-favorite",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
      server: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "Boolean favorite status" },
  },
});

export const isFavoriteHandler: RouteHandler<typeof isFavoriteRoute, AppEnv> = async (c) => {
  const { slug, server } = c.req.valid("query");
  const user = c.get("user")!;

  const favorite = await prisma.favorite.findFirst({
    where: { userId: user.id, slug, server },
  });

  return c.json(Boolean(favorite), HttpStatusCodes.OK);
};

// --- Get Novel Chapter ---

export const getNovelChapterRoute = createRoute({
  method: "get",
  path: "/api/favorites/novel-chapter",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "Last read chapter number" },
  },
});

export const getNovelChapterHandler: RouteHandler<typeof getNovelChapterRoute, AppEnv> = async (c) => {
  const { slug } = c.req.valid("query");
  const user = c.get("user")!;

  const history = await prisma.history.findFirst({
    where: { userId: user.id, slug },
    orderBy: { updatedAt: "desc" },
  });

  return c.json(history ? history.chapter : 0, HttpStatusCodes.OK);
};
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add server/src/routes/favorites.ts
git commit -m "refactor: convert favorites routes to Hono OpenAPI"
```

---

## Task 5: Convert history routes

**Files:**
- Modify: `server/src/routes/history.ts`

- [ ] **Step 1: Rewrite history.ts**

Replace the full contents of `server/src/routes/history.ts`:

```ts
import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../lib/appFactory";
import { prisma } from "../db";
import { authMiddleware } from "../auth/authMiddleware";

// --- Get Novels ---

export const getNovelsRoute = createRoute({
  method: "get",
  path: "/api/history/novels",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: { description: "List of novels with history" },
  },
});

export const getNovelsHandler: RouteHandler<typeof getNovelsRoute, AppEnv> = async (c) => {
  const user = c.get("user")!;

  return c.json(
    await prisma.history.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      distinct: ["slug"],
    }),
    HttpStatusCodes.OK
  );
};

// --- Novel History ---

export const novelHistoryRoute = createRoute({
  method: "get",
  path: "/api/history/novel",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "Chapter history for a novel" },
  },
});

export const novelHistoryHandler: RouteHandler<typeof novelHistoryRoute, AppEnv> = async (c) => {
  const { slug } = c.req.valid("query");
  const user = c.get("user")!;

  const chapters = await prisma.history.findMany({
    where: { userId: user.id, slug },
  });

  return c.json(chapters, HttpStatusCodes.OK);
};

// --- Add ---

export const addHistoryRoute = createRoute({
  method: "post",
  path: "/api/history",
  middleware: [authMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            slug: z.string(),
            chapter: z.string(),
            server: z.string(),
            sentenceIndex: z.number(),
            length: z.number(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "History entry added" },
  },
});

export const addHistoryHandler: RouteHandler<typeof addHistoryRoute, AppEnv> = async (c) => {
  const { slug, server, chapter, sentenceIndex, length } = c.req.valid("json");
  const user = c.get("user")!;

  const entry = await prisma.history.upsert({
    where: {
      userId_slug_chapter_server: {
        slug, chapter, server, userId: user.id,
      },
    },
    create: { slug, chapter, server, sentenceIndex, length, userId: user.id },
    update: { length, sentenceIndex },
  });

  return c.json(entry, HttpStatusCodes.OK);
};

// --- Clear Novel History ---

export const clearNovelHistoryRoute = createRoute({
  method: "delete",
  path: "/api/history/novel",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
      server: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "Novel history cleared" },
  },
});

export const clearNovelHistoryHandler: RouteHandler<typeof clearNovelHistoryRoute, AppEnv> = async (c) => {
  const { slug, server } = c.req.valid("query");
  const user = c.get("user")!;

  const result = await prisma.history.deleteMany({
    where: { userId: user.id, server, slug },
  });

  return c.json(result, HttpStatusCodes.OK);
};

// --- Read ---

export const readHistoryRoute = createRoute({
  method: "get",
  path: "/api/history",
  middleware: [authMiddleware],
  request: {
    query: z.object({
      slug: z.string(),
      chapter: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "History entry" },
  },
});

export const readHistoryHandler: RouteHandler<typeof readHistoryRoute, AppEnv> = async (c) => {
  const { slug, chapter } = c.req.valid("query");
  const user = c.get("user")!;

  const entry = await prisma.history.findFirst({
    where: { userId: user.id, slug, chapter },
  });

  return c.json(entry, HttpStatusCodes.OK);
};
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add server/src/routes/history.ts
git commit -m "refactor: convert history routes to Hono OpenAPI"
```

---

## Task 6: Convert settings routes

**Files:**
- Modify: `server/src/routes/settings.ts`

- [ ] **Step 1: Rewrite settings.ts**

Replace the full contents of `server/src/routes/settings.ts`:

```ts
import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../lib/appFactory";
import { prisma } from "../db";
import { authMiddleware } from "../auth/authMiddleware";

// --- Get State ---

export const getSettingsRoute = createRoute({
  method: "get",
  path: "/api/settings",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: { description: "User settings" },
  },
});

export const getSettingsHandler: RouteHandler<typeof getSettingsRoute, AppEnv> = async (c) => {
  const user = c.get("user")!;

  const state = await prisma.settings.findUnique({
    where: { userId: user.id },
  });

  if (!state) {
    return c.json(
      await prisma.settings.create({ data: { userId: user.id } }),
      HttpStatusCodes.OK
    );
  }

  return c.json(state, HttpStatusCodes.OK);
};

// --- Update ---

export const updateSettingsRoute = createRoute({
  method: "post",
  path: "/api/settings",
  middleware: [authMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            autoAdvance: z.boolean().optional(),
            font: z.enum(["serif", "sans_serif", "monospace"]).optional(),
            fontSize: z.number().optional(),
            speed: z.number().optional(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "Updated settings" },
  },
});

export const updateSettingsHandler: RouteHandler<typeof updateSettingsRoute, AppEnv> = async (c) => {
  const input = c.req.valid("json");
  const user = c.get("user")!;

  const updated = await prisma.settings.upsert({
    where: { userId: user.id },
    create: { ...input, userId: user.id },
    update: input,
  });

  return c.json(updated, HttpStatusCodes.OK);
};

// --- Replacement Rules ---

export const getReplacementRulesRoute = createRoute({
  method: "get",
  path: "/api/settings/replacement-rules",
  middleware: [authMiddleware],
  responses: {
    [HttpStatusCodes.OK]: { description: "Replacement rules" },
  },
});

export const getReplacementRulesHandler: RouteHandler<typeof getReplacementRulesRoute, AppEnv> = async (c) => {
  const user = c.get("user")!;

  const rules = await prisma.replacementRule.findMany({
    where: { userId: user.id },
  });

  return c.json(rules, HttpStatusCodes.OK);
};

// --- Update Replacement Rules ---

export const updateReplacementRulesRoute = createRoute({
  method: "post",
  path: "/api/settings/replacement-rules",
  middleware: [authMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            replacementRules: z.array(
              z.object({
                from: z.string(),
                to: z.string(),
              })
            ),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: { description: "Updated replacement rules" },
  },
});

export const updateReplacementRulesHandler: RouteHandler<typeof updateReplacementRulesRoute, AppEnv> = async (c) => {
  const { replacementRules } = c.req.valid("json");
  const user = c.get("user")!;

  const rules = replacementRules.map((rule) => ({
    ...rule,
    userId: user.id,
  }));

  await prisma.replacementRule.deleteMany({
    where: { userId: user.id },
  });

  await prisma.replacementRule.createMany({ data: rules });

  return c.json(rules, HttpStatusCodes.OK);
};
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add server/src/routes/settings.ts
git commit -m "refactor: convert settings routes to Hono OpenAPI"
```

---

## Task 7: Convert auth routes

**Files:**
- Modify: `server/src/routes/auth.ts`
- Modify: `server/src/auth/google.ts`
- Modify: `server/src/auth/logout.ts`

- [ ] **Step 1: Rewrite auth.ts**

Replace the full contents of `server/src/routes/auth.ts`:

```ts
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../lib/appFactory";
import { optionalAuthMiddleware } from "../auth/authMiddleware";
import { googleLogin, googleCallback } from "../auth/google";
import { logout } from "../auth/logout";

// --- Is Authenticated ---

export const isAuthenticatedRoute = createRoute({
  method: "get",
  path: "/api/auth/is-authenticated",
  middleware: [optionalAuthMiddleware],
  responses: {
    [HttpStatusCodes.OK]: { description: "Authentication status" },
  },
});

export const isAuthenticatedHandler: RouteHandler<typeof isAuthenticatedRoute, AppEnv> = async (c) => {
  const user = c.get("user");
  const session = c.get("session");
  return c.json(Boolean(user && session), HttpStatusCodes.OK);
};

// --- Google Login ---

export const googleLoginRoute = createRoute({
  method: "get",
  path: "/api/auth/google/login",
  responses: {
    [HttpStatusCodes.MOVED_TEMPORARILY]: { description: "Redirect to Google OAuth" },
  },
});

export const googleLoginHandler: RouteHandler<typeof googleLoginRoute, AppEnv> = async (c) => {
  return googleLogin(c);
};

// --- Google Callback ---

export const googleCallbackRoute = createRoute({
  method: "get",
  path: "/api/auth/google/callback",
  responses: {
    [HttpStatusCodes.MOVED_TEMPORARILY]: { description: "OAuth callback redirect" },
  },
});

export const googleCallbackHandler: RouteHandler<typeof googleCallbackRoute, AppEnv> = async (c) => {
  return googleCallback(c);
};

// --- Logout ---

export const logoutRoute = createRoute({
  method: "get",
  path: "/api/auth/logout",
  responses: {
    [HttpStatusCodes.MOVED_TEMPORARILY]: { description: "Redirect to login" },
  },
});

export const logoutHandler: RouteHandler<typeof logoutRoute, AppEnv> = async (c) => {
  return logout(c);
};
```

- [ ] **Step 2: Update auth handler type signatures and callback URL**

In `server/src/auth/google.ts`, add import and update signatures:

Add import:
```ts
import type { AppEnv } from "../lib/appFactory";
```

Change both function signatures:
```ts
export async function googleLogin(c: Context<AppEnv>) {
```
```ts
export async function googleCallback(c: Context<AppEnv>) {
```

Update the callback URL:
```ts
`${process.env.BASE_URL}/api/auth/google/callback`,
```

In `server/src/auth/logout.ts`, add import and update signature:

Add import:
```ts
import type { AppEnv } from "../lib/appFactory";
```

Change signature:
```ts
export async function logout(c: Context<AppEnv>) {
```

- [ ] **Step 3: Commit**

```bash
cd /Users/luis/github/reader && git add server/src/routes/auth.ts server/src/auth/google.ts server/src/auth/logout.ts
git commit -m "refactor: convert auth routes to Hono OpenAPI"
```

---

## Task 8: Update server entry point and clean up backend

**Files:**
- Modify: `server/src/server.ts`
- Delete: `server/src/trpc.ts`
- Delete: `server/src/router.ts`
- Delete: `server/src/auth/authProcedure.ts`

- [ ] **Step 1: Rewrite server.ts with flat route registration**

Replace the full contents of `server/src/server.ts`:

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { defaultHook } from "stoker/openapi";
import type { AppEnv } from "./lib/appFactory";

import * as novels from "./routes/novels";
import * as favorites from "./routes/favorites";
import * as history from "./routes/history";
import * as settings from "./routes/settings";
import * as auth from "./routes/auth";

const app = new OpenAPIHono<AppEnv>({ defaultHook });

app.use("*", cors());
app.use("/*", serveStatic({ root: "../../client/dist" }));

const api = app
  // novels
  .openapi(novels.searchRoute, novels.searchHandler)
  .openapi(novels.chaptersRoute, novels.chaptersHandler)
  .openapi(novels.chapterRoute, novels.chapterHandler)
  // favorites
  .openapi(favorites.addFavoriteRoute, favorites.addFavoriteHandler)
  .openapi(favorites.deleteFavoriteRoute, favorites.deleteFavoriteHandler)
  .openapi(favorites.readFavoritesRoute, favorites.readFavoritesHandler)
  .openapi(favorites.isFavoriteRoute, favorites.isFavoriteHandler)
  .openapi(favorites.getNovelChapterRoute, favorites.getNovelChapterHandler)
  // history
  .openapi(history.getNovelsRoute, history.getNovelsHandler)
  .openapi(history.novelHistoryRoute, history.novelHistoryHandler)
  .openapi(history.addHistoryRoute, history.addHistoryHandler)
  .openapi(history.clearNovelHistoryRoute, history.clearNovelHistoryHandler)
  .openapi(history.readHistoryRoute, history.readHistoryHandler)
  // settings
  .openapi(settings.getSettingsRoute, settings.getSettingsHandler)
  .openapi(settings.updateSettingsRoute, settings.updateSettingsHandler)
  .openapi(settings.getReplacementRulesRoute, settings.getReplacementRulesHandler)
  .openapi(settings.updateReplacementRulesRoute, settings.updateReplacementRulesHandler)
  // auth
  .openapi(auth.isAuthenticatedRoute, auth.isAuthenticatedHandler)
  .openapi(auth.googleLoginRoute, auth.googleLoginHandler)
  .openapi(auth.googleCallbackRoute, auth.googleCallbackHandler)
  .openapi(auth.logoutRoute, auth.logoutHandler);

app.get("*", async () => {
  return new Response(Bun.file("../../client/dist/index.html"));
});

export type AppType = typeof api;

const port = process.env.PORT || 3000;

export default {
  port,
  fetch: app.fetch,
};
```

- [ ] **Step 2: Delete old tRPC files**

```bash
cd /Users/luis/github/reader && rm server/src/trpc.ts server/src/router.ts server/src/auth/authProcedure.ts
```

- [ ] **Step 3: Remove `@trpc/server` from server dependencies**

```bash
cd /Users/luis/github/reader/server && bun remove @trpc/server
```

- [ ] **Step 4: Verify server compiles**

```bash
cd /Users/luis/github/reader/server && bunx tsc --noEmit
```

If there are type errors, fix them before proceeding.

- [ ] **Step 5: Commit**

```bash
cd /Users/luis/github/reader && git add -A
git commit -m "refactor: wire up Hono OpenAPI routes and remove tRPC server"
```

---

## Task 9: Create frontend API client and query infrastructure

**Files:**
- Create: `client/src/api/client.ts`
- Create: `client/src/api/queryKeys.ts`
- Create: `client/src/api/queryClient.tsx`

- [ ] **Step 1: Create Hono typed client**

Create `client/src/api/client.ts`:

```ts
import { hc } from "hono/client";
// @ts-ignore
import type { AppType } from "../../server/src/server";

export const api = hc<AppType>("/");
```

- [ ] **Step 2: Create query key constants**

Create `client/src/api/queryKeys.ts`:

```ts
export const NOVELS_SEARCH = "novels-search";
export const NOVELS_CHAPTERS = "novels-chapters";
export const NOVELS_CHAPTER = "novels-chapter";
export const FAVORITES = "favorites";
export const FAVORITES_IS_FAVORITE = "favorites-is-favorite";
export const FAVORITES_NOVEL_CHAPTER = "favorites-novel-chapter";
export const HISTORY_NOVELS = "history-novels";
export const HISTORY_NOVEL = "history-novel";
export const HISTORY_READ = "history-read";
export const SETTINGS = "settings";
export const SETTINGS_REPLACEMENT_RULES = "settings-replacement-rules";
export const AUTH_IS_AUTHENTICATED = "auth-is-authenticated";

export type SlugServerInput = {
  slug: string;
  server: string;
};

export type ReplacementRulesInput = {
  replacementRules: { from: string; to: string }[];
};
```

- [ ] **Step 3: Create QueryClient provider**

Create `client/src/api/queryClient.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/api/client.ts client/src/api/queryKeys.ts client/src/api/queryClient.tsx
git commit -m "feat: add Hono RPC client, query keys, and QueryProvider"
```

---

## Task 10: Migrate main.tsx

**Files:**
- Modify: `client/src/main.tsx`

- [ ] **Step 1: Swap TRPCProvider for QueryProvider**

Replace the full contents of `client/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "./api/queryClient";
import { Router } from "./pages/router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <Toaster
        toastOptions={{
          classNames: {
            closeButton: "bg-black text-white border-[#333333] w-6 h-6 hover:text-black duration-200 transition-colors",
          },
        }}
        closeButton
      />
      <Router />
    </QueryProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/main.tsx
git commit -m "refactor: swap TRPCProvider for QueryProvider in main.tsx"
```

---

## Task 11: Migrate home.tsx

**Files:**
- Modify: `client/src/pages/home.tsx`

- [ ] **Step 1: Replace tRPC hooks with React Query + Hono client**

In `client/src/pages/home.tsx`:

Replace import:
```ts
import { trpc } from "@/trpc";
```
With:
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { NOVELS_SEARCH, AUTH_IS_AUTHENTICATED } from "@/api/queryKeys";
```

Replace the two hooks:
```ts
const searchQuery = trpc.novels.search.useQuery(search, {
  enabled: Boolean(search.search),
});

const { data: isAuthenticated } = trpc.auth.isAuthenticated.useQuery();
```
With:
```ts
const searchQuery = useQuery({
  queryKey: [NOVELS_SEARCH, search],
  queryFn: async () => {
    const res = await api.api.novels.search.$get({
      query: {
        search: search.search,
        page: search.page.toString(),
        server: search.server,
      },
    });
    return res.json();
  },
  enabled: Boolean(search.search),
});

const { data: isAuthenticated } = useQuery({
  queryKey: [AUTH_IS_AUTHENTICATED],
  queryFn: async () => {
    const res = await api.api.auth["is-authenticated"].$get();
    return res.json();
  },
});
```

Also update the logout href from `"/logout"` to `"/api/auth/logout"` (two occurrences).

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/pages/home.tsx
git commit -m "refactor: migrate home.tsx to React Query + Hono client"
```

---

## Task 12: Migrate login.tsx

**Files:**
- Modify: `client/src/pages/login.tsx`

- [ ] **Step 1: Replace tRPC hooks**

Replace import:
```ts
import { trpc } from "@/trpc";
```
With:
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { AUTH_IS_AUTHENTICATED } from "@/api/queryKeys";
```

Replace hook:
```ts
const { data: isAuthenticated, isLoading } =
  trpc.auth.isAuthenticated.useQuery();
```
With:
```ts
const { data: isAuthenticated, isLoading } = useQuery({
  queryKey: [AUTH_IS_AUTHENTICATED],
  queryFn: async () => {
    const res = await api.api.auth["is-authenticated"].$get();
    return res.json();
  },
});
```

Update Google login href from `"/google/login"` to `"/api/auth/google/login"`.

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/pages/login.tsx
git commit -m "refactor: migrate login.tsx to React Query + Hono client"
```

---

## Task 13: Migrate use-player.ts

**Files:**
- Modify: `client/src/lib/use-player.ts`

- [ ] **Step 1: Replace tRPC hooks**

Replace import:
```ts
import { trpc } from "@/trpc";
```
With:
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { SETTINGS_REPLACEMENT_RULES } from "@/api/queryKeys";
```

Replace hook:
```ts
const { data: replaceRules } = trpc.settings.replacementRules.useQuery();
```
With:
```ts
const { data: replaceRules } = useQuery({
  queryKey: [SETTINGS_REPLACEMENT_RULES],
  queryFn: async () => {
    const res = await api.api.settings["replacement-rules"].$get();
    return res.json();
  },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/lib/use-player.ts
git commit -m "refactor: migrate use-player.ts to React Query + Hono client"
```

---

## Task 14: Migrate replace-rules.tsx

**Files:**
- Modify: `client/src/lib/replace-rules.tsx`

- [ ] **Step 1: Replace tRPC hooks**

Replace import:
```ts
import { trpc } from "@/trpc";
```
With:
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { SETTINGS_REPLACEMENT_RULES, type ReplacementRulesInput } from "@/api/queryKeys";
```

Replace hooks inside `ReplaceRules`:
```ts
const utils = trpc.useUtils();
const { data } = trpc.settings.replacementRules.useQuery();
```
With:
```ts
const queryClient = useQueryClient();
const { data } = useQuery({
  queryKey: [SETTINGS_REPLACEMENT_RULES],
  queryFn: async () => {
    const res = await api.api.settings["replacement-rules"].$get();
    return res.json();
  },
});
```

Replace mutation:
```ts
const updateReplacementRules =
  trpc.settings.updateReplacementRules.useMutation({
    onSuccess: () => utils.settings.replacementRules.invalidate(),
  });
```
With:
```ts
const updateReplacementRules = useMutation({
  mutationFn: async (data: ReplacementRulesInput) => {
    const res = await api.api.settings["replacement-rules"].$post({
      json: data,
    });
    return res.json();
  },
  onSuccess: () =>
    queryClient.invalidateQueries({
      queryKey: [SETTINGS_REPLACEMENT_RULES],
    }),
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/lib/replace-rules.tsx
git commit -m "refactor: migrate replace-rules.tsx to React Query + Hono client"
```

---

## Task 15: Migrate settings.tsx

**Files:**
- Modify: `client/src/components/reader/settings.tsx`

- [ ] **Step 1: Replace tRPC imports and hooks**

Replace import:
```ts
import { trpc } from "../../trpc";
```
With:
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { SETTINGS, AUTH_IS_AUTHENTICATED } from "@/api/queryKeys";
```

In `useSettings()`, replace:
```ts
const utils = trpc.useUtils();
const settings = useSettingsStore();
const { data } = trpc.settings.getState.useQuery();

const updateSettings = trpc.settings.update.useMutation({
  onMutate: (value) => useSettingsStore.setState(value),
  onSuccess: () => utils.settings.getState.invalidate(),
});
```
With:
```ts
const queryClient = useQueryClient();
const settings = useSettingsStore();
const { data } = useQuery({
  queryKey: [SETTINGS],
  queryFn: async () => {
    const res = await api.api.settings.$get();
    return res.json();
  },
});

const updateSettings = useMutation({
  mutationFn: async (value: Partial<SettingsState>) => {
    const res = await api.api.settings.$post({ json: value });
    return res.json();
  },
  onMutate: (value) => useSettingsStore.setState(value),
  onSuccess: () =>
    queryClient.invalidateQueries({ queryKey: [SETTINGS] }),
});
```

In `ReaderSettings`, replace:
```ts
const { data: isAuthenticated } = trpc.auth.isAuthenticated.useQuery();
```
With:
```ts
const { data: isAuthenticated } = useQuery({
  queryKey: [AUTH_IS_AUTHENTICATED],
  queryFn: async () => {
    const res = await api.api.auth["is-authenticated"].$get();
    return res.json();
  },
});
```

Update the logout href from `"/logout"` to `"/api/auth/logout"`.

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/components/reader/settings.tsx
git commit -m "refactor: migrate settings.tsx to React Query + Hono client"
```

---

## Task 16: Migrate favorite.tsx

**Files:**
- Modify: `client/src/components/reader/favorite.tsx`

- [ ] **Step 1: Replace tRPC hooks**

Replace import:
```ts
import { trpc } from "../../trpc";
```
With:
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { FAVORITES_IS_FAVORITE, type SlugServerInput } from "@/api/queryKeys";
```

Replace all hooks in `Favorite`:
```ts
const utils = trpc.useUtils();
const { data } = trpc.favorites.isFavorite.useQuery({ slug, server });

const addToFavorites = trpc.favorites.add.useMutation({
  onSuccess: () => {
    toast("Added novel to library");
    utils.favorites.isFavorite.invalidate({ slug, server });
  },
});

const removeFromFavorites = trpc.favorites.delete.useMutation({
  onSuccess: () => {
    toast("Removed novel from library");
    utils.favorites.isFavorite.invalidate({ slug, server });
  },
});
```
With:
```ts
const queryClient = useQueryClient();
const { data } = useQuery({
  queryKey: [FAVORITES_IS_FAVORITE, slug, server],
  queryFn: async () => {
    const res = await api.api.favorites["is-favorite"].$get({
      query: { slug, server },
    });
    return res.json();
  },
});

const addToFavorites = useMutation({
  mutationFn: async (input: SlugServerInput) => {
    const res = await api.api.favorites.$post({ json: input });
    return res.json();
  },
  onSuccess: () => {
    toast("Added novel to library");
    queryClient.invalidateQueries({
      queryKey: [FAVORITES_IS_FAVORITE, slug, server],
    });
  },
});

const removeFromFavorites = useMutation({
  mutationFn: async (input: SlugServerInput) => {
    const res = await api.api.favorites.$delete({
      query: input,
    });
    return res.json();
  },
  onSuccess: () => {
    toast("Removed novel from library");
    queryClient.invalidateQueries({
      queryKey: [FAVORITES_IS_FAVORITE, slug, server],
    });
  },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/components/reader/favorite.tsx
git commit -m "refactor: migrate favorite.tsx to React Query + Hono client"
```

---

## Task 17: Migrate history.tsx

**Files:**
- Modify: `client/src/components/reader/history.tsx`

- [ ] **Step 1: Replace tRPC hooks**

Replace import:
```ts
import { trpc } from "../../trpc";
```
With:
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { HISTORY_NOVELS, type SlugServerInput } from "@/api/queryKeys";
```

In `HistoryItem`, replace:
```ts
const utils = trpc.useUtils();
const deleteMutation = trpc.history.clearNovelHistory.useMutation();
```
With:
```ts
const queryClient = useQueryClient();
const deleteMutation = useMutation({
  mutationFn: async (input: SlugServerInput) => {
    const res = await api.api.history.novel.$delete({
      query: input,
    });
    return res.json();
  },
});
```

In the `deleteMutation.mutate` call, replace the `onSuccess`:
```ts
onSuccess() {
  utils.history.getNovels.invalidate();
},
```
With:
```ts
onSuccess() {
  queryClient.invalidateQueries({
    queryKey: [HISTORY_NOVELS],
  });
},
```

In `History`, replace:
```ts
const { data } = trpc.history.getNovels.useQuery();
```
With:
```ts
const { data } = useQuery({
  queryKey: [HISTORY_NOVELS],
  queryFn: async () => {
    const res = await api.api.history.novels.$get();
    return res.json();
  },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/components/reader/history.tsx
git commit -m "refactor: migrate history.tsx to React Query + Hono client"
```

---

## Task 18: Migrate library.tsx

**Files:**
- Modify: `client/src/components/reader/library.tsx`

- [ ] **Step 1: Replace tRPC hooks**

Replace import:
```ts
import { trpc, trpcVanilla } from "../../trpc";
```
With:
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { FAVORITES, FAVORITES_IS_FAVORITE, AUTH_IS_AUTHENTICATED, type SlugServerInput } from "@/api/queryKeys";
```

In `Favorites`, replace:
```ts
const utils = trpc.useUtils();
const { data, isLoading } = trpc.favorites.read.useQuery();
const removeFavorite = trpc.favorites.delete.useMutation();
```
With:
```ts
const queryClient = useQueryClient();
const { data, isLoading } = useQuery({
  queryKey: [FAVORITES],
  queryFn: async () => {
    const res = await api.api.favorites.$get();
    return res.json();
  },
});
const removeFavorite = useMutation({
  mutationFn: async (input: SlugServerInput) => {
    const res = await api.api.favorites.$delete({ query: input });
    return res.json();
  },
});
```

Replace the `trpcVanilla` call inside the onClick:
```ts
const currentChapter =
  await trpcVanilla.favorites.getNovelChapter.query({
    slug: favorite.slug,
  });
```
With:
```ts
const res = await api.api.favorites["novel-chapter"].$get({
  query: { slug: favorite.slug },
});
const currentChapter = await res.json();
```

Replace the `onSuccess` invalidation in the `removeFavorite.mutate` call:
```ts
onSuccess() {
  toast("Removed novel from library");
  utils.favorites.read.invalidate();
  utils.favorites.isFavorite.invalidate({
    slug: favorite.slug,
    server: favorite.server,
  });
},
```
With:
```ts
onSuccess() {
  toast("Removed novel from library");
  queryClient.invalidateQueries({
    queryKey: [FAVORITES],
  });
  queryClient.invalidateQueries({
    queryKey: [FAVORITES_IS_FAVORITE, favorite.slug, favorite.server],
  });
},
```

In `LibraryContent`, replace:
```ts
const { data, isLoading } = trpc.auth.isAuthenticated.useQuery();
```
With:
```ts
const { data, isLoading } = useQuery({
  queryKey: [AUTH_IS_AUTHENTICATED],
  queryFn: async () => {
    const res = await api.api.auth["is-authenticated"].$get();
    return res.json();
  },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/components/reader/library.tsx
git commit -m "refactor: migrate library.tsx to React Query + Hono client"
```

---

## Task 19: Migrate chapters.tsx

**Files:**
- Modify: `client/src/components/chapters.tsx`

- [ ] **Step 1: Replace tRPC hooks**

Replace import:
```ts
import { trpc } from "@/trpc";
```
With:
```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { NOVELS_CHAPTERS, HISTORY_NOVEL } from "@/api/queryKeys";
```

In `ChaptersDialog`, replace:
```ts
const { data: chapters, isLoading } = trpc.novels.chapters.useQuery({
  slug,
  server,
});

const { data: history } = trpc.history.novelHistory.useQuery(slug);
```
With:
```ts
const { data: chapters, isLoading } = useQuery({
  queryKey: [NOVELS_CHAPTERS, slug, server],
  queryFn: async () => {
    const res = await api.api.novels.chapters.$get({
      query: { slug, server },
    });
    return res.json();
  },
});

const { data: history } = useQuery({
  queryKey: [HISTORY_NOVEL, slug],
  queryFn: async () => {
    const res = await api.api.history.novel.$get({
      query: { slug },
    });
    return res.json();
  },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/components/chapters.tsx
git commit -m "refactor: migrate chapters.tsx to React Query + Hono client"
```

---

## Task 20: Migrate reader.tsx

**Files:**
- Modify: `client/src/pages/reader.tsx`

- [ ] **Step 1: Replace tRPC imports and hooks**

Replace import:
```ts
import { trpc, trpcVanilla } from "../trpc";
```
With:
```ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { NOVELS_CHAPTER, HISTORY_NOVEL } from "@/api/queryKeys";
```

Replace utils:
```ts
const utils = trpc.useUtils();
```
With:
```ts
const queryClient = useQueryClient();
```

Replace the chapter query:
```ts
const { data, isLoading } = trpc.novels.chapter.useQuery(
  {
    novel,
    chapter,
    server,
  },
  {
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }
);
```
With:
```ts
const { data, isLoading } = useQuery({
  queryKey: [NOVELS_CHAPTER, novel, chapter, server],
  queryFn: async () => {
    const res = await api.api.novels.chapter.$get({
      query: { novel, chapter, server },
    });
    return res.json();
  },
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
});
```

In `goToNextPage` and `goToPreviousPage`, replace:
```ts
await utils.novels.chapter.invalidate({ server, chapter, novel });
```
With:
```ts
await queryClient.invalidateQueries({
  queryKey: [NOVELS_CHAPTER, novel, chapter, server],
});
```

In `player.onComplete`, replace:
```ts
await trpcVanilla.history.add.mutate({
  server,
  slug: novel,
  chapter,
  sentenceIndex: 0,
  length: player.sentences.length,
});

await utils.history.novelHistory.invalidate(novel);
```
With:
```ts
await api.api.history.$post({
  json: {
    server,
    slug: novel,
    chapter,
    sentenceIndex: 0,
    length: player.sentences.length,
  },
});

await queryClient.invalidateQueries({
  queryKey: [HISTORY_NOVEL, novel],
});
```

In the `useEffect` that tracks sentence index, replace:
```ts
trpcVanilla.history.add
  .mutate({
    server,
    slug: novel,
    chapter,
    sentenceIndex: player.getCurrentSentenceIndex(),
    length: player.sentences.length,
  })
  .then(() => utils.history.novelHistory.invalidate(novel));
```
With:
```ts
api.api.history
  .$post({
    json: {
      server,
      slug: novel,
      chapter,
      sentenceIndex: player.getCurrentSentenceIndex(),
      length: player.sentences.length,
    },
  })
  .then(() =>
    queryClient.invalidateQueries({
      queryKey: [HISTORY_NOVEL, novel],
    })
  );
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luis/github/reader && git add client/src/pages/reader.tsx
git commit -m "refactor: migrate reader.tsx to React Query + Hono client"
```

---

## Task 21: Delete old tRPC client and remove tRPC dependencies

**Files:**
- Delete: `client/src/trpc.tsx`
- Modify: `client/package.json`

- [ ] **Step 1: Delete the tRPC client file**

```bash
rm /Users/luis/github/reader/client/src/trpc.tsx
```

- [ ] **Step 2: Remove tRPC client dependencies**

```bash
cd /Users/luis/github/reader/client && bun remove @trpc/client @trpc/react-query
```

- [ ] **Step 3: Verify the client compiles**

```bash
cd /Users/luis/github/reader/client && bunx tsc --noEmit
```

Fix any type errors before proceeding.

- [ ] **Step 4: Commit**

```bash
cd /Users/luis/github/reader && git add -A
git commit -m "chore: remove tRPC client dependencies and old trpc.tsx"
```

---

## Task 22: Verify everything works end-to-end

- [ ] **Step 1: Build the client**

```bash
cd /Users/luis/github/reader/client && bun run build
```

- [ ] **Step 2: Start the server and verify manually**

```bash
cd /Users/luis/github/reader/server && bun run dev
```

Test the following in a browser:
- Home page loads and search works
- Login page shows and Google OAuth redirects correctly
- Reading a chapter works (navigation, play/pause)
- Favorites can be added/removed
- History shows and can be cleared
- Settings update correctly
- Replacement rules work

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
cd /Users/luis/github/reader && git add -A
git commit -m "fix: address issues found during end-to-end testing"
```
