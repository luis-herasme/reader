import { initTRPC } from "@trpc/server";
import { getAuthContext } from "./auth/getAuthContext";

export const t = initTRPC
  .context<Awaited<ReturnType<typeof getAuthContext>>>()
  .create();

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
