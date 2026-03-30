import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/app-factory";
import { ErrorSchema } from "../../lib/error-schema";
import { prisma } from "../../db";
import { apiKeyMiddleware } from "../../lib/api-key-middleware";
import { uploadImage } from "../../lib/r2";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const UploadBookInput = z.object({
  title: z.string().trim().min(1, "title is required"),
  author: z.string().default(""),
  description: z.string().default(""),
});

const UploadBookOutput = z.object({
  bookId: z.string(),
});

export const uploadBookRoute = createRoute({
  method: "post",
  path: "/api/novels/upload-book",
  middleware: [apiKeyMiddleware],
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(UploadBookOutput, "Book created"),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(ErrorSchema, "Validation error"),
  },
});

export const uploadBookHandler: RouteHandler<
  typeof uploadBookRoute,
  AppEnv
> = async (context) => {
  const body = await context.req.parseBody();

  const parsed = UploadBookInput.safeParse(body);
  if (!parsed.success) {
    return context.json(
      { error: parsed.error.errors[0].message },
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  const { title, author, description } = parsed.data;

  let imageBuffer: Buffer | null = null;
  let imageContentType: string | null = null;
  const imageFile = body["image"];

  if (imageFile instanceof File) {
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      return context.json(
        { error: "Image must be PNG or JPEG" },
        HttpStatusCodes.BAD_REQUEST,
      );
    }

    if (imageFile.size > MAX_IMAGE_SIZE) {
      return context.json(
        { error: "Image must be less than 5MB" },
        HttpStatusCodes.BAD_REQUEST,
      );
    }

    imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    imageContentType = imageFile.type;
  }

  let createdImageId: string | null = null;

  if (imageBuffer && imageContentType) {
    const image = await prisma.image.create({
      data: { contentType: imageContentType },
    });

    createdImageId = image.id;

    try {
      await uploadImage({
        key: image.id,
        body: imageBuffer,
        contentType: imageContentType,
      });
    } catch (error) {
      await prisma.image.delete({ where: { id: image.id } });
      throw error;
    }
  }

  const book = await prisma.book.create({
    data: {
      title,
      author,
      description,
      imageId: createdImageId,
    },
  });

  return context.json({ bookId: book.id }, HttpStatusCodes.CREATED);
};
