import { fetchMutation } from "convex/nextjs";
import { categories, contentApi, convexOptions, type Project } from "../../../lib/content";
import { editorIdentity, editorSecret } from "../../../lib/editor-auth";
import { discardImage, uploadImage } from "../../../lib/images";
import { enhanceImage } from "../../../lib/enhance-image";

export const maxDuration = 45;

export async function POST(request: Request) {
  if (!(await editorIdentity(request.headers))) return Response.json({ error: "Editor access required." }, { status: 403 });
  const origin = process.env.WEBSITE_ORIGIN;
  if (!origin || request.headers.get("origin") !== origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const form = await request.formData();
    const text = (key: string) => String(form.get(key) ?? "").trim();
    if (text("action") === "enhance") {
      if (process.env.AI_IMAGE_ENHANCEMENT !== "true") return Response.json({ error: "AI enhancement is unavailable." }, { status: 503 });
      const file = form.get("image");
      if (!(file instanceof File) || !file.size || file.size > 4 * 1024 * 1024) {
        return Response.json({ error: "Choose an image up to 4 MB." }, { status: 400 });
      }
      try {
        const image = await enhanceImage(file, request.signal);
        if (image.length > 4 * 1024 * 1024) throw new Error("Enhanced file is too large.");
        return new Response(Uint8Array.from(image), {
          headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
        });
      } catch (error) {
        console.error("Image enhancement failed", error instanceof Error ? error.name : "unknown");
        return Response.json({ error: "Could not enhance this image. You can still use the original." }, { status: 422 });
      }
    }
    const secret = editorSecret();
    const options = convexOptions();
    const id = (text("id") || undefined) as Project["_id"] | undefined;
    if (text("action") === "delete" && id) {
      const result = await fetchMutation(contentApi.remove, { secret, id }, options);
      await discardImage(result.retiredImage);
    } else if (text("action") === "settings") {
      const details = { about: text("about"), address: text("address"), email: text("email"), phone: text("phone"), instagram: text("instagram") };
      if (Object.values(details).some(value => value.length > 4000) ||
        details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) ||
        details.phone && !/^\+?[\d ()-]+$/.test(details.phone) ||
        details.instagram && !/^https:\/\/(?:www\.)?instagram\.com\/[\w.]+\/?$/i.test(details.instagram)) {
        return Response.json({ error: "Check the contact details and text lengths." }, { status: 400 });
      }
      await fetchMutation(contentApi.settings, { secret, details }, options);
    } else if (text("action") === "project") {
      const title = text("title"), category = text("category"), description = text("description");
      if (!title || title.length > 120 || !categories.includes(category) || description.length > 4000) {
        return Response.json({ error: "Enter a title, valid category, and up to 4,000 characters of description." }, { status: 400 });
      }
      const file = form.get("image");
      const imageKey = file instanceof File && file.size ? await uploadImage(file) : undefined;
      const result = await fetchMutation(contentApi.save, {
        secret, id, title, category, description, imageKey, published: form.get("published") === "on",
      }, options);
      await discardImage(result.retiredImage);
    } else {
      return Response.json({ error: "Invalid editor action." }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Website editor request failed", error instanceof Error ? error.name : "unknown");
    return Response.json({ error: "Could not save. Check the image is JPEG, PNG, or WebP under 4 MB and try again." }, { status: 500 });
  }
}
