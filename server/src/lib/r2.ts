import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: requireEnv("R2_ENDPOINT"),
  credentials: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  },
});

const publicUrl = requireEnv("R2_PUBLIC_URL");
const bucketName = requireEnv("R2_BUCKET_NAME");

type UploadImageInput = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
};

export async function uploadImage(input: UploadImageInput): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
}

export function getImageUrl(key: string): string {
  return `${publicUrl}/${key}`;
}
