import { publicProcedure, router } from "../trpc";

export const auth = router({
  isAuthenticated: publicProcedure.query(async ({ ctx }) => {
    return Boolean(ctx.user && ctx.session);
  }),
});
