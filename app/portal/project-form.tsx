"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Project } from "../../lib/content";
import { coverSource } from "../../lib/project-cover";

function useImagePreview(file?: File) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const preview = file ? URL.createObjectURL(file) : undefined;
    setUrl(preview);
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [file]);
  return url;
}

export default function ProjectForm({ project, categories, enhancementEnabled, locked, setProcessing, submit, close }: {
  project?: Project; categories: string[]; enhancementEnabled: boolean; locked: boolean;
  setProcessing: (value: boolean) => void;
  submit: (data: FormData, message: string) => void; close: () => void;
}) {
  const [original, setOriginal] = useState<File>();
  const [enhanced, setEnhanced] = useState<File>();
  const [useEnhanced, setUseEnhanced] = useState(false);
  const [status, setStatus] = useState("");
  const originalUrl = useImagePreview(original);
  const enhancedUrl = useImagePreview(enhanced);
  const currentCover = coverSource(project?.imageKey, true);

  async function enhance() {
    if (!original || locked) return;
    if (original.size > 4 * 1024 * 1024) {
      setStatus("Choose an image up to 4 MB.");
      return;
    }
    setProcessing(true);
    setStatus("Enhancing cover image…");
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
      if (image.type !== "image/jpeg") throw new Error("An enhanced image was not returned. Check your sign-in session.");
      setEnhanced(new File([image], "enhanced-cover.jpg", { type: image.type }));
      setUseEnhanced(false);
      setStatus("Compare the images and choose which one to save.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not enhance this image.");
    } finally {
      setProcessing(false);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    const published = project?.published || data.get("visibility") === "publish";
    if (published) data.set("published", "on");
    if (useEnhanced && enhanced) data.set("image", enhanced);
    submit(data, project?.published ? "Project updated." : published ? "Project published." : "Draft saved.");
  }

  return <form onSubmit={save}>
    <input type="hidden" name="action" value="project" />
    {project && <input type="hidden" name="id" value={project._id} />}
    <label>Project name<input name="title" required maxLength={120} defaultValue={project?.title} /></label>
    <label>Category<select name="category" defaultValue={project?.category}>
      {categories.map(category => <option key={category}>{category}</option>)}
    </select></label>
    <label>Description<textarea name="description" rows={5} maxLength={4000} defaultValue={project?.description} /></label>
    {currentCover && !original && <figure className="editor-cover"><img src={currentCover} alt="" /><figcaption>Current cover</figcaption></figure>}
    <label>{project?.imageKey ? "Replace cover image" : "Cover image"}
      <input name="image" type="file" accept="image/jpeg,image/png,image/webp" disabled={locked}
        onChange={event => {
          setOriginal(event.currentTarget.files?.[0]);
          setEnhanced(undefined);
          setUseEnhanced(false);
          setStatus("");
        }} />
    </label>
    <small>JPEG, PNG or WebP, up to 4 MB.</small>
    {original && <div className="cover-enhancement">
      {enhancementEnabled && <>
        <div className="actions"><button type="button" disabled={locked} onClick={() => void enhance()}>Enhance with AI</button></div>
        <p className="quiet">Enhancement sends a reduced copy to Vercel AI Gateway.</p>
      </>}
      <p role="status" aria-live="polite">{status}</p>
      <div className="cover-comparison">
        {originalUrl && <figure><img src={originalUrl} alt="" /><figcaption>{enhanced ? "Original" : "Selected cover"}</figcaption></figure>}
        {enhancedUrl && <figure><img src={enhancedUrl} alt="" /><figcaption>Enhanced</figcaption></figure>}
      </div>
      {enhanced && <fieldset>
        <legend>Cover image to save</legend>
        <label><input type="radio" name="cover-option" checked={!useEnhanced} disabled={locked} onChange={() => setUseEnhanced(false)} /> Original</label>
        <label><input type="radio" name="cover-option" checked={useEnhanced} disabled={locked} onChange={() => setUseEnhanced(true)} /> Enhanced</label>
      </fieldset>}
    </div>}
    <div className="actions editor-form-actions">
      <button className="secondary-action" type="button" onClick={close} disabled={locked}>Cancel</button>
      {project?.published ? <button type="submit" disabled={locked}>Save changes</button> : <>
        <button className="secondary-action" type="submit" name="visibility" value="draft" disabled={locked}>Save draft</button>
        <button type="submit" name="visibility" value="publish" disabled={locked}>Publish project</button>
      </>}
    </div>
  </form>;
}
