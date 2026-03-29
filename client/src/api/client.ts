import { hc } from "hono/client";
import type { AppType } from "../../../server/src/server";

export const api = hc<AppType>("/");
