import { headers } from "next/headers";
import { categories, initialSettings, readSite } from "../../lib/content";
import { editorIdentity, editorSecret } from "../../lib/editor-auth";
import Editor from "./editor";

export default async function Portal() {
  const email = await editorIdentity(await headers());
  if (!email) return <main className="portal"><a href="/">← View website</a><h2>Editor access required</h2><p>Open this page through the Cloudflare Access-protected website.</p></main>;
  const { projects, settings } = await readSite(editorSecret());
  return <main className="portal">
    <a href="/">← View website</a>
    <h2>Editor portal</h2><p className="quiet">{email}</p>
    <Editor projects={projects} settings={settings ?? initialSettings} categories={categories}
      enhancementEnabled={process.env.AI_IMAGE_ENHANCEMENT === "true"} />
  </main>;
}
