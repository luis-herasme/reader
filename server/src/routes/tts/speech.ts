import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { jsonContentRequired } from "stoker/openapi/helpers";
import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppEnv } from "../../lib/app-factory";
import { synthesize } from "../../lib/edge-tts";

const SpeechInput = z.object({
  input: z.string(),
  options: z.object({
    voice: z.string(),
  }),
});

export const speechRoute = createRoute({
  method: "post",
  path: "/api/tts/speech",
  request: {
    body: jsonContentRequired(SpeechInput, "TTS payload"),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description: "Audio stream",
      content: {
        "audio/mpeg": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
    },
  },
});

export const speechHandler: RouteHandler<typeof speechRoute, AppEnv> = async (
  context,
) => {
  const { input, options } = context.req.valid("json");
  const audioBuffer = await synthesize({ input, voice: options.voice });

  return new Response(new Uint8Array(audioBuffer), {
    status: HttpStatusCodes.OK,
    headers: {
      "Content-Type": "audio/mpeg",
    },
  }) as unknown as ReturnType<RouteHandler<typeof speechRoute, AppEnv>>;
};
