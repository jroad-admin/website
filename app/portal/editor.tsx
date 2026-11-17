"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { Project, Settings, TeamMember } from "../../lib/content";
import { coverSource, isPlaceholderCover } from "../../lib/project-cover";
import EditorDialog from "./editor-dialog";
import ProjectForm from "./project-form";

type Panel =
  | { kind: "project-form"; project?: Project }
  | { kind: "project-view"; project: Project }
  | { kind: "member-form"; member?: TeamMember }
  | { kind: "member-view"; member: TeamMember }
  | { kind: "delete"; entity: "project" | "member"; id: string; name: string };

function formData(action: string, id?: string) {
  const data = new FormData();
  data.set("action", action);
  if (id) data.set("id", id);
  return data;
}

export default function Editor({ projects, settings, categories, enhancementEnabled, members }: {
  projects: Project[]; settings: Settings; categories: string[]; enhancementEnabled: boolean; members: TeamMember[];
}) {
  const router = useRouter();
  const section = useSearchParams().get("section");
  const tab = section === "about" || section === "settings" ? section : "projects";
  const [refreshing, refresh] = useTransition();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState<Panel>();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const locked = saving || processing || refreshing;

  function open(next: Panel) {
    setMessage("");
    setPanel(next);
  }

  function close() {
    setPanel(undefined);
    setMessage("");
  }

  async function save(data: FormData, success: string) {
    if (locked) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/editor", { method: "POST", body: data });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Could not save. Check your editor sign-in and try again.");
      setPanel(undefined);
      setMessage(success);
      refresh(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>, success: string) {
    event.preventDefault();
    void save(new FormData(event.currentTarget), success);
  }

  const publishedCount = projects.filter(project => project.published).length;
  const visible = projects.filter(project =>
    (filter === "all" || project.published === (filter === "published")) &&
    `${project.title} ${project.category}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const updating = saving || refreshing;
  const notice = <p className="editor-feedback" role="status" aria-live="polite">
    {updating ? <><span className="editor-saving-indicator" aria-hidden="true" />{saving ? "Saving…" : "Refreshing…"}</> : message}
  </p>;
  const activeProject = panel?.kind === "project-view" ? panel.project : undefined;
  const activeMember = panel?.kind === "member-view" ? panel.member : undefined;

  return <div className="editor-workspace">
    <nav className="editor-tabs" aria-label="Editor sections">
      {([["projects", "Projects"], ["about", "About"], ["settings", "Site details"]] as const).map(([value, label]) =>
        <button key={value} type="button" aria-pressed={tab === value} disabled={locked} onClick={() => {
          const url = new URL(window.location.href);
          if (value === "projects") url.searchParams.delete("section");
          else url.searchParams.set("section", value);
          window.history.replaceState(null, "", url);
          setMessage("");
        }}>{label}</button>
      )}
    </nav>
    {!panel && notice}
    {tab === "projects" && <section className="editor-overview">
      <div className="editor-section-heading">
        <div><h2>Projects</h2><p>{projects.length} total · {publishedCount} published · {projects.length - publishedCount} drafts</p></div>
        <button type="button" className="editor-primary" disabled={locked} onClick={() => open({ kind: "project-form" })}>New project</button>
      </div>
      <div className="project-toolbar">
        <label>Search projects<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name or category" /></label>
        <label>Status<select value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="all">All statuses</option><option value="published">Published</option><option value="draft">Drafts</option>
        </select></label>
      </div>
      {visible.length ? <div className="editor-projects">{visible.map(project => {
        const cover = coverSource(project.imageKey, true);
        return <article key={project._id} className="editor-project">
          {cover ? <img className="project-thumbnail" src={cover} alt="" loading="lazy" />
            : <div className="project-thumbnail editor-empty-cover">No cover image</div>}
          <div className="editor-card-content">
            <div className="editor-card-meta"><span>{project.category}</span><span className={project.published ? "status-live" : "status-draft"}>{project.published ? "Published" : "Draft"}</span></div>
            <h3>{project.title}</h3>
            {isPlaceholderCover(project.imageKey) && <small>Placeholder project</small>}
            <div className="actions editor-card-actions">
              <button type="button" disabled={locked} onClick={() => open({ kind: "project-view", project })}>View</button>
              <button type="button" disabled={locked} onClick={() => open({ kind: "project-form", project })}>Edit</button>
              <button type="button" className="delete-action" disabled={locked}
                onClick={() => open({ kind: "delete", entity: "project", id: project._id, name: project.title })}>Delete</button>
            </div>
          </div>
        </article>;
      })}</div> : <p className="editor-empty">{projects.length ? "No projects match your search." : "No projects yet. Choose New project to create one."}</p>}
    </section>}
    {tab === "about" && <section className="editor-overview">
      <div className="editor-section-heading">
        <div><h2>Team profiles</h2><p>{members.length} {members.length === 1 ? "profile" : "profiles"} on the About page</p></div>
        <div className="actions"><a href="/about" target="_blank" rel="noopener noreferrer">View About page ↗</a>
          <button type="button" className="editor-primary" disabled={locked || members.length >= 20}
            onClick={() => open({ kind: "member-form" })}>Add team member</button></div>
      </div>
      {members.length ? <div className="editor-members">{members.map(member => <article key={member.id} className="editor-member">
        <div><h3>{member.name}</h3>{member.role && <p>{member.role}</p>}</div>
        <div className="actions editor-card-actions">
          <button type="button" disabled={locked} onClick={() => open({ kind: "member-view", member })}>View</button>
          <button type="button" disabled={locked} onClick={() => open({ kind: "member-form", member })}>Edit</button>
          <button type="button" className="delete-action" disabled={locked}
            onClick={() => open({ kind: "delete", entity: "member", id: member.id, name: member.name })}>Delete</button>
        </div>
      </article>)}</div> : <p className="editor-empty">No team profiles yet.</p>}
    </section>}
    {tab === "settings" && <section className="editor-overview editor-settings">
      <div className="editor-section-heading"><h2>Site details</h2></div>
      <form onSubmit={event => submit(event, "Site details updated.")}>
        <input type="hidden" name="action" value="settings" />
        <label>Homepage studio introduction<textarea name="about" rows={6} maxLength={4000} defaultValue={settings.about} /></label>
        <label>Address<textarea name="address" maxLength={300} defaultValue={settings.address} /></label>
        <label>Email<input name="email" type="email" defaultValue={settings.email} /></label>
        <label>Phone<input name="phone" type="tel" defaultValue={settings.phone} /></label>
        <label>Instagram profile URL<input name="instagram" type="url" defaultValue={settings.instagram} /></label>
        <div className="actions"><button type="submit" disabled={locked}>Save site details</button></div>
      </form>
    </section>}
    {panel?.kind === "project-form" && <EditorDialog title={panel.project ? "Edit project" : "New project"} locked={locked} close={close}>
      {notice}
      <ProjectForm project={panel.project} categories={categories} enhancementEnabled={enhancementEnabled}
        locked={locked} setProcessing={setProcessing} submit={(data, success) => void save(data, success)} close={close} />
    </EditorDialog>}
    {activeProject && <EditorDialog title={activeProject.title} locked={locked} close={close}>
      {notice}
      <p className="editor-card-meta">{activeProject.category} · {activeProject.published ? "Published" : "Draft"}</p>
      {activeProject.imageKey && <figure className="editor-cover"><img src={coverSource(activeProject.imageKey, true)} alt="" /></figure>}
      <p className="editor-bio">{activeProject.description || "No description yet."}</p>
      <div className="actions editor-form-actions">
        {activeProject.published && <a href={`/work/${activeProject._id}`} target="_blank" rel="noopener noreferrer">View live ↗</a>}
        <button type="button" disabled={locked} onClick={() => open({ kind: "project-form", project: activeProject })}>Edit project</button>
        <button type="button" disabled={locked} onClick={() => {
          const data = formData("visibility", activeProject._id);
          if (!activeProject.published) data.set("published", "on");
          void save(data, activeProject.published ? "Project moved to drafts." : "Project published.");
        }}>{activeProject.published ? "Unpublish" : "Publish project"}</button>
      </div>
    </EditorDialog>}
    {panel?.kind === "member-form" && <EditorDialog title={panel.member ? "Edit team member" : "Add team member"} locked={locked} close={close}>
      {notice}
      <form onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        data.set("action", "save-member");
        data.set("id", panel.member?.id ?? crypto.randomUUID());
        void save(data, "Team profile saved.");
      }}>
        <label>Name<input name="name" required maxLength={120} defaultValue={panel.member?.name} /></label>
        <label>Role<input name="role" maxLength={120} defaultValue={panel.member?.role} /></label>
        <label>About me<textarea name="bio" rows={6} maxLength={3000} defaultValue={panel.member?.bio} /></label>
        <div className="actions editor-form-actions"><button type="button" disabled={locked} onClick={close}>Cancel</button>
          <button type="submit" disabled={locked}>Save profile</button></div>
      </form>
    </EditorDialog>}
    {activeMember && <EditorDialog title={activeMember.name} locked={locked} close={close}>
      {activeMember.role && <p>{activeMember.role}</p>}
      <p className="editor-bio">{activeMember.bio || "No bio yet."}</p>
      <div className="actions editor-form-actions"><button type="button"
        onClick={() => open({ kind: "member-form", member: activeMember })}>Edit profile</button></div>
    </EditorDialog>}
    {panel?.kind === "delete" && <EditorDialog title={`Delete ${panel.entity}?`} locked={locked} close={close}>
      {notice}
      <p><strong>{panel.name}</strong> will be removed from the editor and from the public site.</p>
      <div className="actions editor-form-actions">
        <button type="button" disabled={locked} onClick={close}>Cancel</button>
        <button type="button" className="editor-danger" disabled={locked} onClick={() =>
          void save(formData(panel.entity === "project" ? "delete" : "delete-member", panel.id),
            panel.entity === "project" ? "Project deleted." : "Team profile deleted.")
        }>Delete {panel.entity}</button>
      </div>
    </EditorDialog>}
  </div>;
}
