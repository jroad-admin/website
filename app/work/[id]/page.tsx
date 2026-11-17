import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { readProject } from "../../../lib/content";
import { coverSource, isPlaceholderCover } from "../../../lib/project-cover";
import { SiteFooter, SiteHeader } from "../../site-chrome";

export const dynamic = "force-dynamic";
const projectForRequest = cache(readProject);

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await projectForRequest(id);
  if (!result) return {};
  return { title: `${result.project.title} — JROAD`, description: result.project.description.slice(0, 150) };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const result = await projectForRequest(id);
  if (!result) notFound();
  const { project, instagram } = result;
  return <>
    <SiteHeader instagram={instagram} current="/work" />
    <main className="wrap interior">
      <Link href="/work">← All work</Link>
      <p className="eyebrow project-category">{project.category}</p>
      <h1>{project.title}</h1>
      {isPlaceholderCover(project.imageKey) && <p className="quiet">Placeholder project</p>}
      {project.imageKey && <img className="project-cover" src={coverSource(project.imageKey)} alt={project.title} />}
      <p className="studio-copy">{project.description}</p>
    </main>
    <SiteFooter />
  </>;
}
