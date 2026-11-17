import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

function storage() {
  const { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("Image storage is not configured.");
  }
  return {
    client: new S3Client({
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, region: "auto",
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    }),
    bucket: R2_BUCKET_NAME,
  };
}

export async function readUploadedImage(file: File) {
  if (file.size > 4 * 1024 * 1024) throw new Error("Choose an image under 4 MB.");
  const data = Buffer.from(await file.arrayBuffer());
  const mime = data.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? "image/jpeg"
    : data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png"
    : data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : null;
  if (!mime) throw new Error("Choose a JPEG, PNG or WebP image.");
  return { data, mime };
}

export async function uploadImage(file: File) {
  const { data, mime } = await readUploadedImage(file);
  const { client, bucket } = storage();
  const key = randomUUID();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: mime }));
  return key;
}

export async function readImage(key: string) {
  const { client, bucket } = storage();
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return object.Body && new Response(object.Body.transformToWebStream(), {
    headers: {
      "Content-Type": object.ContentType || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function discardImage(key?: string) {
  if (!key) return;
  try {
    const { client, bucket } = storage();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    console.error("Failed to delete retired image", key, error);
  }
}
