"use client";

import Link from "next/link";
import { useState } from "react";
import type { Project } from "../lib/content";

export default function Gallery({ projects, categories }: { projects: Project[]; categories: string[] }) {
  const [filter, setFilter] = useState("All");
  const visible = filter === "All" ? projects : projects.filter(project => project.category === filter);
  return <>
    <div className="filters" role="group" aria-label="Filter by project type">
      {["All", ...categories].map(category => <button type="button" key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}
    </div>
    {visible.length === 0 && <p className="quiet" role="status">{projects.length ? "No projects in this category yet." : "Project gallery coming soon."}</p>}
    <div className="projects">{visible.map(project => (
      <Link href={`/work/${project._id}`} className="tile" key={project._id}>
        {project.imageKey && <img src={`/media/${project.imageKey}`} alt="" loading="lazy" />}
        <span>{project.title}</span>
      </Link>
    ))}</div>
  </>;
}
