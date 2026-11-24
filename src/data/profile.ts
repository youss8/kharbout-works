const availableFrom = new Date("2027-01-01T00:00:00Z");
const availabilityMonth = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(availableFrom);
const availabilityShortMonth = new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(availableFrom);
const relocation = "Open to Relocation to Germany";

export const profile = {
  fullName: "Youssef Kharbout",
  monogram: "YK",
  brandName: "Youssef Operations Kit",
  headline: "Full-Stack Software Engineer & Systems Architect",
  subheadline:
    "I design and build workflow software for portfolio tracking and HR, from data rules and approvals to the interfaces people use every day.",
  pillars: [
    {
      index: "01",
      title: "Critical Thinking & System Architecture Design",
      summary:
        "First-principles relational schemas, database-enforced invariants, RLS/RBAC security boundaries, and deterministic state machines designed before writing UI code.",
    },
    {
      index: "02",
      title: "Creative, Useful Operational Workflows",
      summary:
        "Replacing fragmented paper trails, manual notepad calculations, and broken spreadsheets with cohesive, bilingual (LTR/RTL) enterprise web software.",
    },
    {
      index: "03",
      title: "Disciplined AI Engineering",
      summary:
        "Reusable AI Gems, structured coding skills, provider-agnostic LLM gateways, and OAuth MCP tool integrations—engineered systematically, never unstructured vibe coding.",
    },
  ],
  availability: {
    month: availabilityMonth,
    badge: `OPEN TO TECH ROLES · ${availabilityShortMonth.toUpperCase()}`,
    careerFocus: "I’m seeking commercial tech roles at remote international startups and SaaS product companies, freelance engineering projects, and tech relocation to Germany.",
    targetRoles: [
      "Full-Stack Software Engineer",
      "Product / Systems Engineer",
      "AI-Native Full-Stack Developer",
    ],
    targetEnvironments: [
      "Remote International Tech Startups & SaaS",
      "Tech Companies (Relocation to Germany)",
      "Technical Freelance & Architecture Projects",
    ],
    sectorTransitionNote:
      "Transitioning from internal NGO systems engineering exclusively into commercial tech startups, SaaS product teams, and international engineering roles (not seeking NGO roles).",
    location: "Aleppo, Syria (UTC+3)",
    relocation,
    mobility: `Remote Worldwide · ${relocation}`,
  },
  contact: {
    email: "youssefkharbout3@gmail.com",
    github: "https://github.com/youss8",
    githubHandle: "youss8",
    linkedin: "https://www.linkedin.com/in/youssef-kharbout",
    repoUrl: "https://github.com/youss8/youssef-operations-kit",
  },
  aggregateMetrics: [
    { value: "280+", label: "Live DB Tables", note: "Across 3 audited repos (solo + 3-dev team)" },
    { value: "363", label: "SQL Migrations", note: "PostgreSQL & MySQL zero-downtime schemas" },
    { value: "794", label: "Test Files", note: "Pest, PHPUnit, Playwright, axe-core, Node" },
    { value: "2", label: "Full-Stack Ecosystems", note: "TS/React 19/Postgres + PHP 8.5/Laravel 13/MySQL" },
  ],
  experience: [
    {
      role: "Full-Stack Web Developer & IT Systems Specialist",
      defaultOrgLabel: "Multi-Branch Operations Organization (NGO)",
      period: "Nov 2024 – Dec 2026",
      location: "Aleppo, Syria · ~150 Staff Countrywide (50 Local Hub · 50–60 Weekly Active Platform Users)",
      highlights: [
        "Multi-Entity Funding, Portfolio & KPI Analytics Platform (~80% Primary Architect & Builder, 3-dev team): Led workflow design, UI architecture, and core implementation across ~98 tables, 197 migrations, 175 Action classes, and 481 Pest test files—tracking full organizational history from 2018–present with PHP/SQL-synced pooled KPI ratios, non-mixing multi-currency tracking, and interactive Gantt/Sankey views.",
        "HR Lifecycle Platform (Core Contributor & Co-Architect, 3-dev team, Pre-RMS Core): Co-built the foundational architecture, employee directory, immutable asSigned() contract amendments, deterministic leave pricing engine, and attendance workflows serving ~240 employees and 75–100 monthly active users—replacing paper forms and manual notepad math to cut HR administrative workload by 75%+ and cross-department workflow overhead by ~65%.",
        "IT Operations & Asset Helpdesk (Solo Side Project): Designed and built a TypeScript, React and PostgreSQL prototype for service requests, asset records and endpoint telemetry. Architecture-verified. Fleet rollout was held.",
      ],
    },
  ],
  education: [
    {
      degree: "B.Eng. in Informatics Engineering",
      institution: "University of Aleppo",
      details: "5-Year Engineering Degree",
    },
  ],
  certifications: [
    { name: "Critical Thinking & Creative Thinking", issuer: "IBM" },
    { name: "AI Prompting Specialization", issuer: "Google" },
    { name: "Training of Trainers (TOT) Certification", issuer: "Leadership & Facilitation" },
  ],
  languages: [
    { name: "Arabic", level: "Native / Mother Tongue", cefr: "Native", progress: 100 },
    { name: "English", level: "C1 — Advanced Professional", cefr: "C1", progress: 90 },
    { name: "German", level: "A1.2 — Active B1 Track (6–8 months)", cefr: "A1.2 → B1", progress: 30 },
    { name: "French", level: "Beginner", cefr: "A1", progress: 15 },
  ],
  leadership: {
    title: "Youth Leadership & Training Facilitation (2015 – Present)",
    sections: [
      "11+ years of Scout youth leadership (2015–present), mentoring ages 9–20 in teamwork, personal development, emotional and social maturity, mindfulness, and community impact.",
      "Training of Trainers (TOT) certified. Designed and delivered workshops on personality, leading by example, and self-development for leadership cohorts ages 20–30.",
    ],
  },
  coreStack: {
    languages: ["TypeScript 5.8 (Strict)", "PHP 8.5 (Strict)", "SQL (PostgreSQL / MySQL)", "JavaScript (ESNext)", "HTML5 / CSS3"],
    backendAndData: [
      "Laravel 13",
      "TanStack Start (Nitro / SSR / RPC)",
      "PostgreSQL (RLS, PL/pgSQL Triggers, Row Locks)",
      "MySQL (Dual-Connection & Derived-Table Rollups)",
      "Laravel Reverb (WebSockets)",
      "Fortify (WebAuthn Passkeys / TOTP) & Spatie Ecosystem",
    ],
    frontendAndUx: [
      "React 19",
      "Livewire 4 (SFC + Blaze)",
      "Alpine.js 3",
      "Tailwind CSS v4",
      "Astro 5",
      "Flux UI 2 / shadcn/ui (Radix)",
      "Full Bilingual LTR/RTL Architecture",
    ],
    aiAndQuality: [
      "Model Context Protocol (MCP / OAuth)",
      "Anthropic / OpenAI / Gemini / Ollama Gateways",
      "Structured Prompt & Skill Engineering",
      "Pest 5 / PHPUnit 12 / Playwright + axe-core / Larastan",
      "Git / GitHub / CycloneDX SBOM",
    ],
  },
};
