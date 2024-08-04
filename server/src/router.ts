import { router } from "./trpc";
import { settings } from "./routes/settings";
import { favorites } from "./routes/favorites";
import { history } from "./routes/history";
import { auth } from "./routes/auth";
import { novels } from "./routes/novels";

export const appRouter = router({
  settings,
  favorites,
  history,
  auth,
  novels,
});

export type AppRouter = typeof appRouter;
