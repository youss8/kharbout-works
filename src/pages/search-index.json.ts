import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import type { CommandIndex, SearchEntry } from "../data/command-index";
import { profile } from "../data/profile";
import { labProjects } from "../data/lab";
import { sandboxTitles } from "../data/sandbox-directory";

const pages = [
  ["/", "Engineering workbench", "Youssef Kharbout’s profile, availability and systems overview."],
  ["/systems/", "Systems comparison", "Compare ownership, scale, data models and access controls."],
  ["/vault/", "Component vault", "Try dual-stack interface patterns and copy their source."],
  ["/ai-kit/", "AI engineering toolkit", "Compile and download Gems, coding skills and workflows."],
  ["/templates/", "Operations templates", "Architecture, planning, operations and technical handovers."],
  ["/lab/", "R&D lab", "Four interactive personal prototypes."],
  ["/cv/", "Interactive CV", "International and DACH formats, employer override and A4 PDF printing."],
];
const sandboxKeywords: Record<string, string[]> = {
  "service-desk": ["SLA", "React", "queue", "ticket", "first response"],
  "estate-overview": ["React", "RLS", "telemetry", "patch panel", "endpoint", "availability"],
  "leave-engine": ["leave", "refund", "approval", "HR", "Laravel", "Alpine"],
  "attendance-amend": ["asSigned", "contract", "overtime", "redaction", "Laravel", "Alpine"],
  "kpi-cockpit": ["pooled ratio", "denominator", "rollup", "KPI", "Laravel", "Alpine"],
  "funding-flow": ["Sankey", "tranche", "agreement", "currency", "Laravel", "Alpine"],
};

export const GET: APIRoute = async () => {
  const [systems, vault, ai, templates] = await Promise.all([
    getCollection("systems"), getCollection("vault"), getCollection("ai-kit"), getCollection("templates"),
  ]);
  const entries: SearchEntry[] = pages.map(([href, title, summary]) => ({ group: "pages", kind: "Page", title, summary, href, keywords: [] }));
  const byCode = new Map<string, string>();
  const bySandbox = new Map<string, string>();
  for (const project of labProjects) {
    entries.push({ group: "pages", kind: "Prototype", title: project.title, summary: project.summary,
      href: "/lab/#" + project.id, keywords: [project.id, "R&D", "lab"] });
  }
  for (const { id, data } of systems.sort((a, b) => a.data.order - b.data.order)) {
    const href = "/systems/" + id + "/";
    byCode.set(data.code, href);
    entries.push({ group: "pages", kind: data.code, title: data.title, summary: data.scopeNote, href,
      keywords: [data.code, data.ecosystem, data.ownershipBadge, ...data.stack] });
    for (const demoId of data.demoIds) {
      const target = href + "#" + demoId;
      bySandbox.set(demoId, target);
      entries.push({ group: "pages", kind: "Sandbox", title: sandboxTitles[demoId], summary: data.code + " · " + data.title,
        href: target, keywords: [demoId, ...(sandboxKeywords[demoId] ?? [])] });
    }
  }
  for (const { id, data } of vault.sort((a, b) => a.data.order - b.data.order)) {
    entries.push({ group: "assets", kind: "Vault", title: data.title, summary: data.summary, href: "/vault/#" + id,
      keywords: [id, data.category, data.sourceSystem, "RTL", "React", "Alpine", "Livewire"] });
  }
  for (const { id, data } of ai.sort((a, b) => a.data.order - b.data.order)) {
    entries.push({ group: "assets", kind: data.kind, title: data.title, summary: data.summary, href: "/ai-kit/#" + data.id,
      keywords: [id, data.kind, data.category, ...data.compatibility] });
  }
  for (const { id, data } of templates.sort((a, b) => a.data.order - b.data.order)) {
    entries.push({ group: "assets", kind: "Template", title: data.title, summary: data.summary, href: "/templates/#" + data.id,
      keywords: [id, data.category, ...data.formats] });
  }
  const index: CommandIndex = {
    entries,
    intents: [
      { terms: ["cv", "resume", "résumé", "pdf", "print"], title: "Open the print-ready CV", summary: "Choose International or DACH, then Print / Save PDF.", href: "/cv/" },
      { terms: ["germany", "relocate", "relocation", "dach", "german"], title: "Germany relocation and availability", summary: `${profile.availability.mobility} · Available ${profile.availability.month}.`, href: "/cv/" },
      { terms: ["email", "contact", "hire", "reach"], title: "Email Youssef", summary: profile.contact.email, href: "mailto:" + profile.contact.email },
      { terms: ["solo", "ownership"], title: "Which system was built solo?", summary: "SYS-01 was 100% solo, architecture-verified and held from live fleet rollout.", href: byCode.get("SYS-01") },
      { terms: ["react", "typescript"], title: "Explore the React service desk", summary: "Inspect a ticket, change its state and verify its SLA.", href: bySandbox.get("service-desk") },
      { terms: ["laravel", "livewire", "php"], title: "Explore the Laravel HR case study", summary: "Three-developer team. Youssef co-architected the pre-RMS core.", href: byCode.get("SYS-02") },
      { terms: ["rls", "postgres", "permissions"], title: "How are IT records scoped?", summary: "PostgreSQL row-level security covers all 47 tables in SYS-01.", href: byCode.get("SYS-01") + "#permissions" },
      { terms: ["pooled", "ratio", "denominator"], title: "Inspect the pooled KPI ratio", summary: "Compare pooled numerators and denominators with the average of percentages.", href: bySandbox.get("kpi-cockpit") },
      { terms: ["sankey", "tranche", "funding"], title: "Trace funding through the Sankey", summary: "Follow sponsors, proposals and projects, then mark a tranche received.", href: bySandbox.get("funding-flow") },
      { terms: ["rtl", "direction", "bidi"], title: "Test right-to-left layouts", summary: "Open the component vault and switch the isolated preview to RTL.", href: "/vault/" },
      { terms: ["dark", "light", "theme"], title: "Switch theme", summary: "Change the workbench theme on this device.", action: "theme" },
      { terms: ["mit", "license", "licence"], title: "Read the MIT license", summary: "View the repository’s reuse and copyright terms.", href: profile.contact.repoUrl + "/blob/main/LICENSE" },
    ],
  };
  return Response.json(index);
};
