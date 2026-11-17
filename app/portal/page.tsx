import { headers } from "next/headers";
import { categories, initialSettings, readSite, readTeam } from "../../lib/content";
import { editorIdentity, editorSecret } from "../../lib/editor-auth";
import Editor from "./editor";

export default async function Portal() {
  const email = await editorIdentity(await headers());
  if (!email) return <main className="portal"><a href="/">← View website</a><h2>Editor access required</h2><p>Open this page through the Cloudflare Access-protected website.</p></main>;
  const [{ projects, settings }, members] = await Promise.all([readSite(editorSecret()), readTeam()]);
  return <main className="portal portal-admin">
    <header className="editor-header"><div><a href="/">← View website</a>
      <h1>Website editor</h1></div><p>{email}</p></header>
    <Editor projects={projects} settings={settings ?? initialSettings} categories={categories} members={members}
      enhancementEnabled={process.env.AI_IMAGE_ENHANCEMENT === "true"} />
  </main>;
}
