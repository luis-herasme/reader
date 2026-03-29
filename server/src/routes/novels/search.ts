import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";

const URL = process.env.DATA_URL;

const SearchInput = z.object({
  search: z.string(),
  page: z.coerce.number().min(0).int(),
  server: z.string(),
});

const SearchOutput = z.object({
  results: z.array(
    z.object({
      name: z.string(),
      image: z.string(),
      slug: z.string(),
    }),
  ),
  next: z.boolean(),
});

export const searchRoute = createRoute({
  method: "get",
  path: "/api/novels/search",
  request: { query: SearchInput },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(SearchOutput, "Search results"),
  },
});

export const searchHandler: RouteHandler<typeof searchRoute, AppEnv> = async (
  c,
) => {
  const { search, page, server } = c.req.valid("query");
  const response = await fetch(URL + `/${server}/search/${search}/${page}`);
  if (!response.ok) {
    throw new Error("Failed to search novels");
  }
  return c.json(await response.json(), HttpStatusCodes.OK);
};
