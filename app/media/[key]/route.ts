import { fetchQuery } from "convex/nextjs";
import { contentApi, convexOptions } from "../../../lib/content";
import { editorIdentity } from "../../../lib/editor-auth";
import { readImage } from "../../../lib/images";

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(key)) return new Response(null, { status: 404 });
  try {
    const published = await fetchQuery(contentApi.image, { key }, convexOptions());
    if (!published && !(await editorIdentity(request.headers))) return new Response(null, { status: 404 });
    return await readImage(key) || new Response(null, { status: 404 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
