import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

const project = {
  title: v.string(), category: v.string(), description: v.string(),
  published: v.boolean(), imageKey: v.optional(v.string()),
};
const settings = v.object({
  about: v.string(), address: v.string(), email: v.string(), phone: v.string(), instagram: v.string(),
});

function authorize(secret: string) {
  const expected = process.env.WEBSITE_EDITOR_SECRET;
  if (!expected || expected.length < 32 || secret.length !== expected.length) throw new Error("Forbidden");
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= secret.charCodeAt(i) ^ expected.charCodeAt(i);
  if (mismatch) throw new Error("Forbidden");
}

export const read = query({
  args: { secret: v.optional(v.string()) },
  handler: async (ctx, { secret }) => {
    if (secret !== undefined) authorize(secret);
    const projects = secret === undefined
      ? await ctx.db.query("projects").withIndex("by_published", q => q.eq("published", true)).collect()
      : await ctx.db.query("projects").collect();
    const site = await ctx.db.query("settings").first();
    return { projects, settings: site?.details ?? null };
  },
});

export const saveProject = mutation({
  args: { secret: v.string(), id: v.optional(v.id("projects")), ...project },
  handler: async (ctx, { secret, id, imageKey, ...fields }) => {
    authorize(secret);
    if (!id) return { id: await ctx.db.insert("projects", { ...fields, imageKey }) };
    const previous = await ctx.db.get(id);
    if (!previous) throw new Error("Project not found");
    await ctx.db.patch(id, imageKey ? { ...fields, imageKey } : fields);
    return { id, retiredImage: imageKey ? previous.imageKey as string | undefined : undefined };
  },
});

export const removeProject = mutation({
  args: { secret: v.string(), id: v.id("projects") },
  handler: async (ctx, { secret, id }) => {
    authorize(secret);
    const previous = await ctx.db.get(id);
    if (previous) await ctx.db.delete(id);
    return { retiredImage: previous?.imageKey as string | undefined };
  },
});

export const saveSettings = mutation({
  args: { secret: v.string(), details: settings },
  handler: async (ctx, { secret, details }) => {
    authorize(secret);
    const previous = await ctx.db.query("settings").first();
    if (previous) await ctx.db.patch(previous._id, { details });
    else await ctx.db.insert("settings", { details });
  },
});

export const publishedImage = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db.query("projects").withIndex("by_image", q => q.eq("imageKey", key)).first();
    return row?.published === true;
  },
});

export const publishedProject = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const projectId = ctx.db.normalizeId("projects", id);
    if (!projectId) return null;
    const row = await ctx.db.get(projectId);
    if (!row?.published) return null;
    const site = await ctx.db.query("settings").first();
    return { project: row, instagram: site?.details.instagram };
  },
});
