import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../env";

const s3Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

type UploadImageInput = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
};

export async function uploadImage(input: UploadImageInput): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
}

export function getImageUrl(key: string): string {
  return `${env.R2_PUBLIC_URL}/${key}`;
}
