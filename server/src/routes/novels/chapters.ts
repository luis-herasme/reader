import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";

const URL = process.env.DATA_URL;

const ChaptersInput = z.object({
  slug: z.string(),
  server: z.string(),
});

const ChaptersOutput = z.array(
  z.object({
    title: z.string(),
    slug: z.string(),
  }),
);

export const chaptersRoute = createRoute({
  method: "get",
  path: "/api/novels/chapters",
  request: { query: ChaptersInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ChaptersOutput, "Chapter list"),
  },
});

export const chaptersHandler: RouteHandler<
  typeof chaptersRoute,
  AppEnv
> = async (c) => {
  const { slug, server } = c.req.valid("query");
  const response = await fetch(URL + `/${server}/chapters/${slug}`);
  if (!response.ok) {
    throw new Error("Failed to fetch chapters");
  }
  return c.json(await response.json(), HttpStatusCodes.OK);
};
