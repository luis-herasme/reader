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
