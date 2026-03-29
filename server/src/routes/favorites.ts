import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import type { AppEnv } from "../lib/appFactory";
import { prisma } from "../db";
import { authMiddleware } from "../auth/authMiddleware";

const FavoriteSchema = z.object({
  userId: z.string(),
  slug: z.string(),
  server: z.string(),
  updatedAt: z.coerce.string(),
  createdAt: z.coerce.string(),
});

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
    [HttpStatusCodes.OK]: jsonContent(FavoriteSchema, "Favorite added"),
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
    [HttpStatusCodes.OK]: jsonContent(FavoriteSchema, "Favorite deleted"),
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
    [HttpStatusCodes.OK]: jsonContent(z.array(FavoriteSchema), "List of favorites"),
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
    [HttpStatusCodes.OK]: jsonContent(z.boolean(), "Boolean favorite status"),
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
    [HttpStatusCodes.OK]: jsonContent(z.union([z.string(), z.number()]), "Last read chapter number"),
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
