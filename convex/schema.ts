import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    title: v.string(), category: v.string(), description: v.string(),
    published: v.boolean(), imageKey: v.optional(v.string()),
  }).index("by_published", ["published"]).index("by_image", ["imageKey"]),
  settings: defineTable({
    details: v.object({
      about: v.string(), address: v.string(), email: v.string(), phone: v.string(), instagram: v.string(),
    }),
  }),
  team: defineTable({
    members: v.array(v.object({ id: v.string(), name: v.string(), role: v.string(), bio: v.string() })),
  }),
});
