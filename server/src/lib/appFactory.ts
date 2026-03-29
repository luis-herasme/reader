import { OpenAPIHono } from "@hono/zod-openapi";
import type { User, Session } from "lucia";

export type AppEnv = {
  Variables: {
    user: User | null;
    session: Session | null;
  };
};

export function createRouter() {
  return new OpenAPIHono<AppEnv>();
}
