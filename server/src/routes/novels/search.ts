import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { getImageUrl } from "../../lib/r2";

const SearchInput = z.object({
  title: z.string(),
  skip: z.coerce.number().min(0).int().default(0),
  take: z.coerce.number().min(1).max(100).int().default(10),
});

const BookResult = z.object({
  bookId: z.string(),
  title: z.string(),
  imageUrl: z.string().nullable(),
  author: z.string(),
  description: z.string(),
});

const SearchOutput = z.object({
  books: z.array(BookResult),
  total: z.number(),
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
  context,
) => {
  const { title, skip, take } = context.req.valid("query");

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where: { title: { contains: title, mode: "insensitive" } },
      skip,
      take,
      include: { image: true },
      orderBy: { title: "asc" },
    }),
    prisma.book.count({
      where: { title: { contains: title, mode: "insensitive" } },
    }),
  ]);

  const results = books.map((book) => ({
    bookId: book.id,
    title: book.title,
    imageUrl: book.imageId ? getImageUrl(book.imageId) : null,
    author: book.author,
    description: book.description,
  }));

  return context.json({ books: results, total }, HttpStatusCodes.OK);
};
