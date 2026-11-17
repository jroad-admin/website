"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { Project, Settings, TeamMember } from "../../lib/content";

function useImagePreview(file?: File) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file) {
      setUrl(undefined);
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);
  return url;
}

export default function Editor({ projects, settings, categories, enhancementEnabled, members }: {
  projects: Project[]; settings: Settings; categories: string[]; enhancementEnabled: boolean; members: TeamMember[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Project>();
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [original, setOriginal] = useState<File>();
  const [enhanced, setEnhanced] = useState<File>();
  const [useEnhanced, setUseEnhanced] = useState(false);
  const [profiles, setProfiles] = useState(members);
  const originalUrl = useImagePreview(original);
  const enhancedUrl = useImagePreview(enhanced);
  const locked = busy || processing;

  function changeCover(file?: File) {
    setOriginal(file);
    setEnhanced(undefined);
    setUseEnhanced(false);
  }

  async function enhanceCover() {
    if (!original || locked) return;
    if (original.size > 4 * 1024 * 1024) {
      setMessage("Choose an image up to 4 MB.");
      return;
    }
    setProcessing(true);
    setMessage("Enhancing cover image…");
    const data = new FormData();
    data.set("action", "enhance");
    data.set("image", original);
    try {
      const response = await fetch("/api/editor", { method: "POST", body: data });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Could not enhance this image.");
      }
      const image = await response.blob();
      if (image.type !== "image/jpeg") throw new Error("An enhanced image was not returned. Sign in again if your session expired.");
      setEnhanced(new File([image], "enhanced-cover.jpg", { type: image.type }));
      setUseEnhanced(false);
      setMessage("Compare the images and choose which one to save as the cover.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enhance this image.");
    } finally {
      setProcessing(false);
    }
  }

  async function save(data: FormData, after?: () => void) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/editor", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed.");
      after?.();
      setMessage("Changes saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>, after?: () => void) {
    event.preventDefault();
    if (locked) return;
    const data = new FormData(event.currentTarget);
    if (data.get("action") === "project" && useEnhanced && enhanced) data.set("image", enhanced);
    void save(data, after);
  }

  function reset() {
    setEditing(undefined);
    changeCover();
    setRevision(value => value + 1);
  }

  function editProfile(id: string, field: "name" | "role" | "bio", value: string) {
    setProfiles(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function submitProfiles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const data = new FormData();
    data.set("action", "team");
    data.set("members", JSON.stringify(profiles));
    void save(data);
  }

  function remove(project: Project) {
    if (!confirm(`Delete “${project.title}” and its cover image?`)) return;
    const data = new FormData();
    data.set("action", "delete");
    data.set("id", project._id);
    void save(data, editing?._id === project._id ? reset : undefined);
  }

  return <>
    <p role="status" aria-live="polite">{message}</p>
    <section>
      <h2>Projects</h2>
      {projects.map(project => <div className="editor-row" key={project._id}>
        <span>{project.title} · {project.published ? "Published" : "Draft"}</span>
        <div className="actions">
          <button type="button" disabled={locked} onClick={() => { if (editing?._id !== project._id) changeCover(); setEditing(project); }}>Edit</button>
          <button type="button" disabled={locked} onClick={() => remove(project)}>Delete</button>
        </div>
      </div>)}
      <h3>{editing ? `Edit ${editing.title}` : "Add a project"}</h3>
      <form key={editing?._id ?? revision} onSubmit={event => submit(event, reset)}>
        <input type="hidden" name="action" value="project" />
        {editing && <input type="hidden" name="id" value={editing._id} />}
        <label>Title<input name="title" required maxLength={120} defaultValue={editing?.title} /></label>
        <label>Category<select name="category" defaultValue={editing?.category}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
        <label>Description<textarea name="description" maxLength={4000} defaultValue={editing?.description} /></label>
        <label>Cover image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" disabled={locked}
          onChange={event => changeCover(event.currentTarget.files?.[0])} /></label>
        <small>{editing?.imageKey ? "Upload a new image to replace the current cover. " : ""}JPEG, PNG or WebP, up to 4 MB.</small>
        {enhancementEnabled && original && <div className="cover-enhancement" aria-busy={processing}>
          <div className="actions"><button type="button" disabled={locked} onClick={() => void enhanceCover()}>Enhance with AI</button></div>
          <p className="quiet">Enhancement sends a reduced copy to Vercel AI Gateway to suggest lighting and colour adjustments.</p>
          <div className="cover-comparison">
            {originalUrl && <figure><img src={originalUrl} alt="Original cover image" /><figcaption>Original</figcaption></figure>}
            {enhancedUrl && <figure><img src={enhancedUrl} alt="Cover image with adjusted lighting and colour" /><figcaption>Enhanced</figcaption></figure>}
          </div>
          {enhanced && <fieldset>
            <legend>Cover image to save</legend>
            <label><input type="radio" name="cover-option" checked={!useEnhanced} disabled={locked} onChange={() => setUseEnhanced(false)} /> Original</label>
            <label><input type="radio" name="cover-option" checked={useEnhanced} disabled={locked} onChange={() => setUseEnhanced(true)} /> Enhanced</label>
          </fieldset>}
        </div>}
        <label className="actions" style={{ display: "flex", alignItems: "center" }}><input style={{ width: "auto" }} name="published" type="checkbox" defaultChecked={editing?.published} /> Show on website</label>
        <div className="actions"><button type="submit" disabled={locked}>Save project</button>{editing && <button type="button" disabled={locked} onClick={reset}>Cancel edit</button>}</div>
      </form>
    </section>
    <form onSubmit={event => submit(event)}>
      <input type="hidden" name="action" value="settings" />
      <section id="about-page" aria-labelledby="about-page-heading">
        <h2 id="about-page-heading">Homepage studio introduction</h2>
        <label>About the studio<textarea name="about" rows={7} maxLength={4000} defaultValue={settings.about} /></label>
        <div className="actions settings-actions">
          <button type="submit" disabled={locked}>Save page content</button>
        </div>
      </section>
      <section aria-labelledby="contact-details-heading">
        <h2 id="contact-details-heading">Contact details</h2>
        <div className="settings-fields">
          <label>Address<textarea name="address" maxLength={300} defaultValue={settings.address} /></label>
          <label>Email<input name="email" type="email" defaultValue={settings.email} /></label>
          <label>Phone<input name="phone" type="tel" defaultValue={settings.phone} /></label>
          <label>Instagram profile URL<input name="instagram" type="url" defaultValue={settings.instagram} /></label>
        </div>
        <div className="actions settings-actions"><button type="submit" disabled={locked}>Save page content</button></div>
      </section>
    </form>
    <section aria-labelledby="team-heading">
      <h2 id="team-heading">About page team profiles</h2>
      <form onSubmit={submitProfiles}>
        {profiles.map((member, index) => <fieldset className="profile-fields" key={member.id}>
          <legend>{member.name || `Member ${index + 1}`}</legend>
          <label>Name<input required maxLength={120} value={member.name} onChange={event => editProfile(member.id, "name", event.target.value)} /></label>
          <label>Role<input maxLength={120} value={member.role} onChange={event => editProfile(member.id, "role", event.target.value)} /></label>
          <label>About me<textarea rows={4} maxLength={3000} value={member.bio} onChange={event => editProfile(member.id, "bio", event.target.value)} /></label>
          <div className="actions"><button type="button" disabled={locked}
            onClick={() => setProfiles(items => items.filter(item => item.id !== member.id))}>Remove profile</button></div>
        </fieldset>)}
        <div className="actions">
          <button type="button" disabled={locked || profiles.length >= 20}
            onClick={() => setProfiles(items => [...items, { id: crypto.randomUUID(), name: "", role: "", bio: "" }])}>Add team member</button>
          <button type="submit" disabled={locked}>Save team profiles</button>
          <a href="/about" target="_blank" rel="noopener noreferrer">View About page ↗</a>
        </div>
      </form>
    </section>
  </>;
}
