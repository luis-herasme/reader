import type { User, Session } from "lucia";

export type AppEnv = {
  Variables: {
    user: User | null;
    session: Session | null;
  };
};
