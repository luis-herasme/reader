import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { appRouter } from "./router";
import { googleCallback, googleLogin } from "./auth/google";
import { getAuthContext } from "./auth/getAuthContext";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { logout } from "./auth/logout";

const app = new Hono();

app.use("*", cors());

app.use("/*", serveStatic({ root: "../../client/dist" }));

app.use("/trpc/*", async (c) => {
  const response = await fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: getAuthContext,
    onError: ({ error }) => {
      console.log("Error: ", error);
    },
  });
  return response;
});

app.get("/logout", logout);
app.get("/google/login", googleLogin);
app.get("/google/callback", googleCallback);

app.get("*", async (c) => {
  return new Response(Bun.file("../../client/dist/index.html"));
});

const port = process.env.PORT || 3000;

export default {
  port,
  fetch: app.fetch,
};
