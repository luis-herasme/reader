import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { apiKeyMiddleware } from "../../lib/apiKeyMiddleware";

const UploadChapterInput = z.object({
  bookId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  number: z.number().int().min(0),
});

const UploadChapterOutput = z.object({
  chapterId: z.string(),
});

export const uploadChapterRoute = createRoute({
  method: "post",
  path: "/api/novels/upload-chapter",
  middleware: [apiKeyMiddleware],
  request: {
    body: jsonContentRequired(UploadChapterInput, "Chapter to upload"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(UploadChapterOutput, "Chapter created"),
  },
});

export const uploadChapterHandler: RouteHandler<
  typeof uploadChapterRoute,
  AppEnv
> = async (context) => {
  const { bookId, title, content, number } = context.req.valid("json");

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) {
    return context.json(
      { error: "Book not found" } as unknown as z.infer<typeof UploadChapterOutput>,
      HttpStatusCodes.NOT_FOUND as 201,
    );
  }

  const chapter = await prisma.chapter.create({
    data: { bookId, title, content, number },
  });

  return context.json({ chapterId: chapter.id }, HttpStatusCodes.CREATED);
};
