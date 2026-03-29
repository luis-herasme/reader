import { hc } from "hono/client";
// @ts-ignore
import type { AppType } from "../../server/src/server";

export const api = hc<AppType>("/");
