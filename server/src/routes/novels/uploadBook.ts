import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/appFactory";
import { prisma } from "../../db";
import { apiKeyMiddleware } from "../../lib/apiKeyMiddleware";
import { uploadImage } from "../../lib/r2";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const UploadBookOutput = z.object({
  bookId: z.string(),
});

export const uploadBookRoute = createRoute({
  method: "post",
  path: "/api/novels/upload-book",
  middleware: [apiKeyMiddleware],
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(UploadBookOutput, "Book created"),
  },
});

export const uploadBookHandler: RouteHandler<
  typeof uploadBookRoute,
  AppEnv
> = async (context) => {
  const body = await context.req.parseBody();

  const title = body["title"];
  if (typeof title !== "string" || title.trim().length === 0) {
    return context.json(
      { error: "title is required" } as unknown as z.infer<typeof UploadBookOutput>,
      HttpStatusCodes.BAD_REQUEST as 201,
    );
  }

  const author = typeof body["author"] === "string" ? body["author"] : "";
  const description = typeof body["description"] === "string" ? body["description"] : "";

  let imageId: string | null = null;
  const imageFile = body["image"];

  if (imageFile instanceof File) {
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      return context.json(
        { error: "Image must be PNG or JPEG" } as unknown as z.infer<typeof UploadBookOutput>,
        HttpStatusCodes.BAD_REQUEST as 201,
      );
    }

    if (imageFile.size > MAX_IMAGE_SIZE) {
      return context.json(
        { error: "Image must be less than 5MB" } as unknown as z.infer<typeof UploadBookOutput>,
        HttpStatusCodes.BAD_REQUEST as 201,
      );
    }

    const image = await prisma.image.create({
      data: { contentType: imageFile.type },
    });

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await uploadImage({
      key: image.id,
      body: buffer,
      contentType: imageFile.type,
    });

    imageId = image.id;
  }

  const book = await prisma.book.create({
    data: {
      title: title.trim(),
      author,
      description,
      imageId,
    },
  });

  return context.json({ bookId: book.id }, HttpStatusCodes.CREATED);
};
