import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { initialTeam, type TeamMember } from "../lib/team-defaults";

const project = {
  title: v.string(), category: v.string(), description: v.string(),
  published: v.boolean(), imageKey: v.optional(v.string()),
};
const settings = v.object({
  about: v.string(), address: v.string(), email: v.string(), phone: v.string(), instagram: v.string(),
});
const teamMember = v.object({ id: v.string(), name: v.string(), role: v.string(), bio: v.string() });

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

export const setProjectPublished = mutation({
  args: { secret: v.string(), id: v.id("projects"), published: v.boolean() },
  handler: async (ctx, { secret, id, published }) => {
    authorize(secret);
    await ctx.db.patch(id, { published });
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

export const readTeam = query({
  args: {},
  handler: async ctx => (await ctx.db.query("team").first())?.members ?? null,
});

export const saveTeam = mutation({
  args: { secret: v.string(), members: v.array(teamMember) },
  handler: async (ctx, { secret, members }) => {
    authorize(secret);
    if (members.length > 20 || new Set(members.map(member => member.id)).size !== members.length ||
      members.some(member => !member.name.trim() || member.name.length > 120 || member.role.length > 120 || member.bio.length > 3000)) {
      throw new Error("Invalid team profiles.");
    }
    const earlier = await ctx.db.query("team").first();
    if (earlier) await ctx.db.patch(earlier._id, { members });
    else await ctx.db.insert("team", { members });
  },
});

export const changeTeamMember = mutation({
  args: { secret: v.string(), id: v.string(), member: v.optional(teamMember) },
  handler: async (ctx, { secret, id, member }) => {
    authorize(secret);
    const row = await ctx.db.query("team").first();
    const members: TeamMember[] = row?.members ?? initialTeam;
    const index = members.findIndex(item => item.id === id);
    if (member && (member.id !== id || !member.name.trim() || member.name.length > 120 ||
      member.role.length > 120 || member.bio.length > 3000 || (index === -1 && members.length >= 20))) {
      throw new Error("Invalid team profile.");
    }
    const next = !member ? members.filter(item => item.id !== id)
      : index === -1 ? [...members, member] : members.map(item => item.id === id ? member : item);
    if (row) await ctx.db.patch(row._id, { members: next });
    else await ctx.db.insert("team", { members: next });
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
