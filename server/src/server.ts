import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { defaultHook } from "stoker/openapi";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { env } from "./env";
import type { AppEnv } from "./lib/app-factory";

import { searchRoute, searchHandler } from "./routes/novels/search";
import { chapterRoute, chapterHandler } from "./routes/novels/chapter";
import { chaptersRoute, chaptersHandler } from "./routes/novels/chapters";
import {
  uploadBookRoute,
  uploadBookHandler,
} from "./routes/novels/upload-book";
import {
  uploadChapterRoute,
  uploadChapterHandler,
} from "./routes/novels/upload-chapter";

import {
  addFavoriteRoute,
  addFavoriteHandler,
} from "./routes/favorites/add-favorite";
import {
  isFavoriteRoute,
  isFavoriteHandler,
} from "./routes/favorites/is-favorite";
import {
  readFavoritesRoute,
  readFavoritesHandler,
} from "./routes/favorites/read-favorites";
import {
  deleteFavoriteRoute,
  deleteFavoriteHandler,
} from "./routes/favorites/delete-favorite";
import {
  getNovelChapterRoute,
  getNovelChapterHandler,
} from "./routes/favorites/get-novel-chapter";

import {
  addHistoryRoute,
  addHistoryHandler,
} from "./routes/history/add-history";
import {
  readHistoryRoute,
  readHistoryHandler,
} from "./routes/history/read-history";
import { getNovelsRoute, getNovelsHandler } from "./routes/history/get-novels";
import {
  novelHistoryRoute,
  novelHistoryHandler,
} from "./routes/history/novel-history";
import {
  clearNovelHistoryRoute,
  clearNovelHistoryHandler,
} from "./routes/history/clear-novel-history";

import {
  getSettingsRoute,
  getSettingsHandler,
} from "./routes/settings/get-settings";
import {
  updateSettingsRoute,
  updateSettingsHandler,
} from "./routes/settings/update-settings";
import {
  getReplacementRulesRoute,
  getReplacementRulesHandler,
} from "./routes/settings/get-replacement-rules";
import {
  updateReplacementRulesRoute,
  updateReplacementRulesHandler,
} from "./routes/settings/update-replacement-rules";

import { logoutRoute, logoutHandler } from "./routes/auth/logout";
import {
  googleLoginRoute,
  googleLoginHandler,
} from "./routes/auth/google-login";
import {
  isAuthenticatedRoute,
  isAuthenticatedHandler,
} from "./routes/auth/is-authenticated";
import {
  googleCallbackRoute,
  googleCallbackHandler,
} from "./routes/auth/google-callback";

const app = new OpenAPIHono<AppEnv>({ defaultHook });

app.use("*", cors());
app.use("/*", serveStatic({ root: "../../client/dist/" }));

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

const indexHtmlPath = resolve(__dirname, "../../client/dist/index.html");

app.get("*", async (context) => {
  const html = readFileSync(indexHtmlPath, "utf-8");
  return context.html(html);
});

export type AppType = typeof api;

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
