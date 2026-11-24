import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const systems = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/systems" }),
  schema: z.object({
    order: z.number(),
    code: z.string(),
    title: z.string(),
    subtitle: z.string(),
    ownershipBadge: z.string(),
    ownershipPercent: z.string(),
    teamSize: z.string(),
    scopeNote: z.string(),
    realWorldScale: z.string(),
    ecosystem: z.enum(["TypeScript / React 19 / PostgreSQL", "PHP 8.5 / Laravel 13 / MySQL"]),
    stack: z.array(z.string()),
    keyMetrics: z.array(z.object({ label: z.string(), value: z.string() })),
    demoIds: z.array(z.string()),
    toughestProblemSummary: z.string(),
    presentation: z.object({
      headline: z.string(),
      introduction: z.string(),
      workflows: z.array(z.object({ id: z.string(), title: z.string(), task: z.string() })).nonempty(),
      designed: z.array(z.string()).nonempty(),
      built: z.array(z.string()).nonempty(),
      decisions: z.array(z.object({
        title: z.string(),
        rationale: z.string(),
        workflow: z.string(),
        action: z.string(),
      })).nonempty(),
    }).optional(),
  }),
});

const vault = defineCollection({
  loader: glob({ pattern: "*/kit.json", base: "./src/content/vault", generateId: ({ entry }) => entry.split("/")[0] }),
  schema: z.object({
    order: z.number(),
    id: z.string(),
    title: z.string(),
    category: z.enum([
      "Tables & Queues",
      "Workflows & State",
      "Forms & Guards",
      "Data Visualization",
      "Navigation & Shell",
    ]),
    tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    sourceIds: z.array(z.string().regex(/^(PT|IT|HR)-[0-9]{2}$/)).nonempty(),
    sourceSystems: z.array(z.enum(["SYS-01", "SYS-02", "SYS-03", "Cross-System"])).nonempty(),
    provenance: z.enum(["observed", "observed-plus-spec"]),
    summary: z.string(),
    supportsRtl: z.boolean().default(true),
    previewEngine: z.enum(["alpine", "react"]),
    interactionSpecs: z.array(z.string()),
  }).transform(data => ({ ...data, sourceSystem: data.sourceSystems.includes("Cross-System") ? "Cross-System" : data.sourceSystems.join(" + ") })),
});

const aiKit = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/ai-kit" }),
  schema: z.object({
    order: z.number(),
    id: z.string(),
    title: z.string(),
    kind: z.enum(["gem", "skill", "workflow"]),
    category: z.enum(["Architecture", "Backend & SQL", "Code Review", "Operations"]),
    compatibility: z.array(z.string()),
    tokenNotes: z.string(),
    summary: z.string(),
    isStarterPlaceholder: z.boolean().default(true),
    variables: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        defaultValue: z.string(),
        placeholder: z.string(),
      })
    ),
    workflowSteps: z.array(z.string()).optional(),
  }),
});

const templates = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/templates" }),
  schema: z.object({
    order: z.number(),
    id: z.string(),
    title: z.string(),
    category: z.enum(["Architecture", "Planning", "Operations", "Handover"]),
    summary: z.string(),
    isStarterPlaceholder: z.boolean().default(true),
    formats: z.array(z.enum(["md", "json"])),
    jsonContent: z.string().optional(),
  }),
});

export const collections = { systems, vault, "ai-kit": aiKit, templates };
