import cors from "cors";
import path from "path";
import express from "express";
import { appRouter } from "./router";
import { googleCallback, googleLogin } from "./auth/google.ts";
import { getAuthContext } from "./auth/getAuthContext.ts";
import * as trpcExpress from "@trpc/server/adapters/express";
import { logout } from "./auth/logout.ts";

const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, "../../client/dist")));

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: getAuthContext,
    onError: (context) => {
      console.log("Error: ", context.error);
    },
  })
);

app.get("/logout", logout);
app.get("/google/login", googleLogin);
app.get("/google/callback", googleCallback);

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));
