import { TRPCError } from "@trpc/server";
import { middleware, publicProcedure } from "../trpc";

const isAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
    },
  });
});

export const authProcedure = publicProcedure.use(isAuth);
