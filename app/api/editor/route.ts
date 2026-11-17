import { fetchMutation } from "convex/nextjs";
import { categories, contentApi, convexOptions, type Project } from "../../../lib/content";
import { z } from "zod";
import { editorIdentity, editorSecret } from "../../../lib/editor-auth";
import { discardImage, readImage, uploadImage } from "../../../lib/images";
import { isPlaceholderCover } from "../../../lib/project-cover";
import { enhanceImage } from "../../../lib/enhance-image";

export const maxDuration = 45;
const teamProfile = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120),
  bio: z.string().trim().max(3000),
});
const teamProfiles = z.array(teamProfile).max(20);

export async function GET(request: Request) {
  if (!(await editorIdentity(request.headers))) return new Response(null, { status: 403 });
  const key = new URL(request.url).searchParams.get("image") ?? "";
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(key)) return new Response(null, { status: 404 });
  try {
    return await readImage(key) || new Response(null, { status: 404 });
  } catch {
    return new Response(null, { status: 404 });
  }
}

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
      if (!isPlaceholderCover(result.retiredImage)) await discardImage(result.retiredImage);
    } else if (text("action") === "visibility" && id) {
      await fetchMutation(contentApi.publish, { secret, id, published: text("published") === "on" }, options);
    } else if (text("action") === "save-member") {
      const result = teamProfile.safeParse({ id: text("id"), name: text("name"), role: text("role"), bio: text("bio") });
      if (!result.success) return Response.json({ error: "Enter a name and check the profile text lengths." }, { status: 400 });
      await fetchMutation(contentApi.changeMember, { secret, id: result.data.id, member: result.data }, options);
    } else if (text("action") === "delete-member" && text("id")) {
      await fetchMutation(contentApi.changeMember, { secret, id: text("id") }, options);
    } else if (text("action") === "team") {
      const result = teamProfiles.safeParse(JSON.parse(text("members")));
      if (!result.success) return Response.json({ error: "Enter a name for each profile and check the text lengths." }, { status: 400 });
      await fetchMutation(contentApi.saveTeam, { secret, members: result.data }, options);
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
      if (!isPlaceholderCover(result.retiredImage)) await discardImage(result.retiredImage);
    } else {
      return Response.json({ error: "Invalid editor action." }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Website editor request failed", error instanceof Error ? error.name : "unknown");
    return Response.json({ error: "Could not make this change. Try again. If you selected a cover image, check that it’s JPEG, PNG, or WebP and under 4 MB." }, { status: 500 });
  }
}
