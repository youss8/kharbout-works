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
  }),
});

const vault = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/vault" }),
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
    sourceSystem: z.string(),
    summary: z.string(),
    supportsRtl: z.boolean().default(true),
    previewEngine: z.enum(["alpine", "react"]),
    interactionSpecs: z.array(z.string()),
    codeAlpine: z.string(),
    codeReact: z.string(),
    codeLivewirePhp: z.string(),
    codeLivewireBlade: z.string(),
  }),
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
