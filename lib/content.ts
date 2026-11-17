import { makeFunctionReference } from "convex/server";
import { fetchQuery } from "convex/nextjs";
import type { GenericId } from "convex/values";

export const categories = ["Apartments", "Terraces", "Houses", "Renovation", "Commercial"];
export type Project = {
  _id: GenericId<"projects">; title: string; category: string; description: string;
  published: boolean; imageKey?: string;
};
export const initialSettings = {
  about: "JROAD is an architecture design studio based in Auckland, New Zealand.",
  address: "Auckland, New Zealand", email: "info@jroad.co.nz",
  phone: "+64 21 232 0809", instagram: "",
};
export type Settings = typeof initialSettings;
export type TeamMember = { id: string; name: string; role: string; bio: string };
const initialTeam: TeamMember[] = [
  { id: "oscar-park", name: "Oscar Park", role: "Founder, Principal Designer", bio: "" },
];
type Content = { projects: Project[]; settings: Settings | null };
type Save = Omit<Project, "_id"> & { secret: string; id?: Project["_id"] };

export const contentApi = {
  read: makeFunctionReference<"query", { secret?: string }, Content>("content:read"),
  save: makeFunctionReference<"mutation", Save, { id: Project["_id"]; retiredImage?: string }>("content:saveProject"),
  remove: makeFunctionReference<"mutation", { secret: string; id: Project["_id"] }, { retiredImage?: string }>("content:removeProject"),
  settings: makeFunctionReference<"mutation", { secret: string; details: Settings }, null>("content:saveSettings"),
  team: makeFunctionReference<"query", Record<string, never>, TeamMember[] | null>("content:readTeam"),
  saveTeam: makeFunctionReference<"mutation", { secret: string; members: TeamMember[] }, null>("content:saveTeam"),
  image: makeFunctionReference<"query", { key: string }, boolean>("content:publishedImage"),
  project: makeFunctionReference<"query", { id: string }, { project: Project; instagram?: string } | null>("content:publishedProject"),
};

export function convexOptions() {
  const url = process.env.CONVEX_URL;
  if (!url) throw new Error("CONVEX_URL is missing.");
  return { url };
}

export async function readSite(secret?: string): Promise<Content> {
  if (!secret && !process.env.CONVEX_URL) return { projects: [], settings: initialSettings };
  return fetchQuery(contentApi.read, secret ? { secret } : {}, convexOptions());
}

export async function readProject(id: string) {
  if (!process.env.CONVEX_URL) return null;
  return fetchQuery(contentApi.project, { id }, convexOptions());
}

export async function readTeam() {
  if (!process.env.CONVEX_URL) return initialTeam;
  return await fetchQuery(contentApi.team, {}, convexOptions()) ?? initialTeam;
}
