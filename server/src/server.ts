import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { defaultHook } from "stoker/openapi";

import { env } from "./env";
import type { AppEnv } from "./lib/appFactory";

import { searchRoute, searchHandler } from "./routes/novels/search";
import { chapterRoute, chapterHandler } from "./routes/novels/chapter";
import { chaptersRoute, chaptersHandler } from "./routes/novels/chapters";
import { uploadBookRoute, uploadBookHandler } from "./routes/novels/uploadBook";
import {
  uploadChapterRoute,
  uploadChapterHandler,
} from "./routes/novels/uploadChapter";

import {
  addFavoriteRoute,
  addFavoriteHandler,
} from "./routes/favorites/addFavorite";
import {
  isFavoriteRoute,
  isFavoriteHandler,
} from "./routes/favorites/isFavorite";
import {
  readFavoritesRoute,
  readFavoritesHandler,
} from "./routes/favorites/readFavorites";
import {
  deleteFavoriteRoute,
  deleteFavoriteHandler,
} from "./routes/favorites/deleteFavorite";
import {
  getNovelChapterRoute,
  getNovelChapterHandler,
} from "./routes/favorites/getNovelChapter";

import {
  addHistoryRoute,
  addHistoryHandler,
} from "./routes/history/addHistory";
import {
  readHistoryRoute,
  readHistoryHandler,
} from "./routes/history/readHistory";
import { getNovelsRoute, getNovelsHandler } from "./routes/history/getNovels";
import {
  novelHistoryRoute,
  novelHistoryHandler,
} from "./routes/history/novelHistory";
import {
  clearNovelHistoryRoute,
  clearNovelHistoryHandler,
} from "./routes/history/clearNovelHistory";

import {
  getSettingsRoute,
  getSettingsHandler,
} from "./routes/settings/getSettings";
import {
  updateSettingsRoute,
  updateSettingsHandler,
} from "./routes/settings/updateSettings";
import {
  getReplacementRulesRoute,
  getReplacementRulesHandler,
} from "./routes/settings/getReplacementRules";
import {
  updateReplacementRulesRoute,
  updateReplacementRulesHandler,
} from "./routes/settings/updateReplacementRules";

import { logoutRoute, logoutHandler } from "./routes/auth/logout";
import {
  googleLoginRoute,
  googleLoginHandler,
} from "./routes/auth/googleLogin";
import {
  isAuthenticatedRoute,
  isAuthenticatedHandler,
} from "./routes/auth/isAuthenticated";
import {
  googleCallbackRoute,
  googleCallbackHandler,
} from "./routes/auth/googleCallback";

const app = new OpenAPIHono<AppEnv>({ defaultHook });

app.use("*", cors());
app.use("/*", serveStatic({ root: "../../client/dist" }));

const api = app
  // novels
  .openapi(searchRoute, searchHandler)
  .openapi(chapterRoute, chapterHandler)
  .openapi(chaptersRoute, chaptersHandler)
  .openapi(uploadBookRoute, uploadBookHandler)
  .openapi(uploadChapterRoute, uploadChapterHandler)
  // favorites
  .openapi(isFavoriteRoute, isFavoriteHandler)
  .openapi(addFavoriteRoute, addFavoriteHandler)
  .openapi(readFavoritesRoute, readFavoritesHandler)
  .openapi(deleteFavoriteRoute, deleteFavoriteHandler)
  .openapi(getNovelChapterRoute, getNovelChapterHandler)
  // history
  .openapi(getNovelsRoute, getNovelsHandler)
  .openapi(addHistoryRoute, addHistoryHandler)
  .openapi(readHistoryRoute, readHistoryHandler)
  .openapi(novelHistoryRoute, novelHistoryHandler)
  .openapi(clearNovelHistoryRoute, clearNovelHistoryHandler)
  // settings
  .openapi(getSettingsRoute, getSettingsHandler)
  .openapi(updateSettingsRoute, updateSettingsHandler)
  .openapi(getReplacementRulesRoute, getReplacementRulesHandler)
  .openapi(updateReplacementRulesRoute, updateReplacementRulesHandler)
  // auth
  .openapi(logoutRoute, logoutHandler)
  .openapi(googleLoginRoute, googleLoginHandler)
  .openapi(googleCallbackRoute, googleCallbackHandler)
  .openapi(isAuthenticatedRoute, isAuthenticatedHandler);

app.get("*", async () => {
  return new Response(Bun.file("../../client/dist/index.html"));
});

export type AppType = typeof api;

export default {
  port: env.PORT,
  fetch: app.fetch,
};
