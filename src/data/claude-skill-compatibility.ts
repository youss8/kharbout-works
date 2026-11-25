interface PublisherClaim {
    agents: string[];
    source: string;
}

interface SkillFamily extends PublisherClaim {
    slugs: string[];
}

// Each family names the specific guides covered by the linked publisher documentation.
// A tool's install targets, API providers and agents it can launch are not interchangeable.
const families: SkillFamily[] = [
    {
        slugs: [
            'algorithmic-art', 'anthropic-brand-guidelines', 'anthropic-canvas-design',
            'anthropic-docx', 'anthropic-frontend-design', 'anthropic-pdf', 'anthropic-pptx',
            'anthropic-skill-creator', 'anthropic-xlsx', 'doc-coauthoring', 'internal-comms',
            'mcp-builder', 'slack-gif-creator', 'theme-factory', 'webapp-testing',
        ],
        agents: ['Claude Code', 'Claude.ai'],
        source: 'https://github.com/anthropics/skills#try-in-claude-code-claudeai-and-the-api',
    },
    {
        slugs: ['claude-api'],
        agents: ['Claude Code'],
        source: 'https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json',
    },
    {
        slugs: ['cowork-create-cowork-plugin'],
        agents: ['Cowork'],
        source: 'https://github.com/anthropics/knowledge-work-plugins/blob/main/cowork-plugin-management/skills/create-cowork-plugin/SKILL.md',
    },
    {
        slugs: ['cowork-cowork-plugin-customizer'],
        agents: ['Cowork'],
        source: 'https://github.com/anthropics/knowledge-work-plugins/blob/main/cowork-plugin-management/skills/cowork-plugin-customizer/SKILL.md',
    },
    {
        slugs: [
            'design-accessibility-review', 'design-design-critique', 'design-design-handoff',
            'design-design-system', 'design-research-synthesis', 'design-user-research',
            'design-ux-copy', 'marketing-brand-review', 'marketing-campaign-plan',
            'marketing-competitive-brief', 'marketing-content-creation', 'marketing-email-sequence',
            'marketing-performance-report', 'marketing-seo-audit',
        ],
        agents: ['Cowork', 'Claude Code'],
        source: 'https://github.com/anthropics/knowledge-work-plugins',
    },
    {
        slugs: ['spartan-ai-toolkit'],
        agents: ['Claude Code', 'Codex'],
        source: 'https://github.com/c0x12c/ai-toolkit',
    },
    {
        slugs: [
            'mattpocock-skills', 'grill-me', 'improve-codebase-architecture',
            'mattpocock-handoff', 'mattpocock-tdd', 'setup-matt-pocock-skills',
        ],
        agents: [
            'Claude Code', 'Codex', 'GitHub Copilot', 'Gemini CLI', 'Cursor',
            'OpenCode', 'Devin', 'Windsurf', 'Amp', 'Pi',
        ],
        source: 'https://github.com/mattpocock/skills',
    },
    {
        slugs: ['planetscale'],
        agents: ['Claude Code', 'Cowork'],
        source: 'https://github.com/planetscale/claude-plugin',
    },
    {
        slugs: ['code-simplifier'],
        agents: ['Claude Code'],
        source: 'https://claude.com/plugins/code-simplifier',
    },
    {
        slugs: ['terrashark'],
        agents: ['Claude Code', 'Codex', 'Antigravity', 'Gemini CLI'],
        source: 'https://github.com/LukasNiessen/terrashark',
    },
    {
        slugs: ['humanizer'],
        agents: ['Claude Code', 'Codex', 'Claude.ai', 'Claude Desktop', 'Gemini CLI', 'GitHub Copilot', 'Windsurf', 'Pi'],
        source: 'https://github.com/blader/humanizer#installation',
    },
    {
        slugs: ['agent-skills', 'code-review-and-quality', 'security-and-hardening'],
        agents: [
            'Claude Code', 'Codex', 'Cursor', 'Gemini CLI', 'GitHub Copilot',
            'OpenCode', 'Antigravity CLI', 'Cline', 'Kiro', 'Command Code',
        ],
        source: 'https://github.com/addyosmani/agent-skills',
    },
    {
        slugs: ['rea'],
        agents: ['Claude Code', 'Codex', 'Cursor'],
        source: 'https://github.com/morluto/rea',
    },
    {
        slugs: ['vercel-react-best-practices', 'vercel-web-design-guidelines'],
        agents: ['Claude Code', 'GitHub Copilot', 'Cursor', 'Cline'],
        source: 'https://vercel.com/docs/agent-resources/skills',
    },
    {
        slugs: ['vercel-react-best-practices'],
        agents: ['Codex', 'OpenCode'],
        source: 'https://vercel.com/blog/introducing-react-best-practices',
    },
    {
        slugs: ['azure-ai', 'azure-storage', 'azure-validate'],
        agents: ['GitHub Copilot', 'Claude Code', 'Codex', 'Cursor', 'Gemini CLI', 'OpenCode'],
        source: 'https://github.com/microsoft/azure-skills',
    },
    {
        slugs: ['superpowers'],
        agents: [
            'Claude Code', 'Codex', 'Cursor', 'Gemini CLI', 'GitHub Copilot',
            'Antigravity', 'Devin', 'Factory Droid', 'Grok Build', 'Kimi Code', 'OpenCode',
            'Pi', 'Qwen Code', 'Hermes Agent', 'Muse',
        ],
        source: 'https://github.com/obra/superpowers#installation',
    },
    {
        slugs: ['impeccable'],
        agents: [
            'Claude Code', 'Codex', 'Cursor', 'GitHub Copilot', 'Gemini CLI',
            'OpenCode', 'Antigravity', 'Devin', 'Replit Agent', 'Grok Build', 'Hermes Agent',
            'DeepSeek Harness', 'Pi', 'Qoder', 'Rovo Dev', 'Mistral Vibe', 'Kiro', 'Trae', 'Veto',
        ],
        source: 'https://github.com/pbakaus/impeccable',
    },
    {
        slugs: ['google-agents-cli-adk-code', 'google-agents-cli-deploy', 'google-agents-cli-publish', 'google-agents-cli-workflow'],
        agents: ['Antigravity CLI', 'Claude Code', 'Codex'],
        source: 'https://github.com/google/agents-cli',
    },
    {
        slugs: ['google-agents-cli-adk-code', 'google-agents-cli-deploy', 'google-agents-cli-publish', 'google-agents-cli-workflow'],
        agents: ['Gemini CLI'],
        source: 'https://github.com/google/agents-cli/blob/main/gemini-extension.json',
    },
    {
        slugs: ['caveman'],
        agents: ['Claude Code', 'Codex', 'Gemini CLI', 'OpenCode'],
        source: 'https://github.com/juliusbrussee/caveman',
    },
    {
        slugs: ['supabase', 'supabase-postgres-best-practices'],
        agents: ['Claude Code', 'GitHub Copilot', 'Cursor', 'Cline'],
        source: 'https://github.com/supabase/agent-skills',
    },
    {
        slugs: ['typescript-advanced-types', 'tailwind-design-system'],
        agents: ['Claude Code', 'Codex', 'Cursor', 'OpenCode', 'Antigravity CLI', 'GitHub Copilot', 'Pi'],
        source: 'https://github.com/wshobson/agents',
    },
    {
        slugs: ['workers-best-practices'],
        agents: ['Claude Code', 'Codex', 'GitHub Copilot', 'Cursor', 'OpenCode'],
        source: 'https://github.com/cloudflare/skills',
    },
    {
        slugs: ['accessibility'],
        agents: ['Claude Code', 'Codex', 'Gemini CLI', 'Claude.ai', 'Cursor', 'OpenCode'],
        source: 'https://github.com/addyosmani/web-quality-skills',
    },
    {
        slugs: ['agent-browser'],
        agents: ['Claude Code', 'Codex', 'Cursor'],
        source: 'https://agent-browser.dev/skills',
    },
    {
        slugs: ['playwright-cli'],
        agents: ['Claude Code', 'GitHub Copilot'],
        source: 'https://github.com/microsoft/playwright-cli',
    },
    {
        slugs: ['ponytail'],
        agents: [
            'Claude Code', 'Codex', 'GitHub Copilot', 'Gemini CLI', 'Cursor', 'OpenCode',
            'Pi', 'Kimi Code', 'Qwen Code', 'Qoder', 'Antigravity CLI', 'Hermes Agent', 'Devin', 'Grok Build',
        ],
        source: 'https://github.com/DietrichGebert/ponytail/blob/main/INSTALL.md',
    },
    {
        slugs: ['defuddle', 'obsidian-bases', 'obsidian-markdown'],
        agents: ['Claude Code', 'Codex', 'ChatGPT Desktop', 'Cursor', 'Gemini CLI', 'OpenCode'],
        source: 'https://github.com/obsidianmd/obsidian-skills',
    },
    {
        slugs: ['gws-drive', 'gws-gmail'],
        agents: ['Gemini CLI'],
        source: 'https://github.com/googleworkspace/cli#gemini-cli-extension',
    },
];

export const publisherCompatibility: Record<string, PublisherClaim[]> = {};
for (const { slugs, agents, source } of families) {
    for (const slug of slugs) {
        (publisherCompatibility[slug] ??= []).push({ agents, source });
    }
}

const officeEdition = 'This guide covers Anthropic’s document-skills package for Claude. OpenAI offers separate Office workflows. A workspace admin can consider OpenAI’s Claude-compatible marketplace import, which needs its own setup and verification.';

export const publisherCompatibilityNotes: Record<string, string> = {
    'anthropic-docx': officeEdition,
    'anthropic-pdf': officeEdition,
    'anthropic-pptx': officeEdition,
    'anthropic-xlsx': officeEdition,
    'spartan-ai-toolkit': 'Claude Code and Codex receive the full toolkit. The publisher also offers rules-only exports for Cursor, Windsurf and Copilot.',
    'planetscale': 'These hosts apply to the PlanetScale plugin. Its connected database tools require access to PlanetScale.',
    'code-simplifier': 'The publisher packages this as a Claude Code plugin with a subagent.',
    'cowork-create-cowork-plugin': 'The publisher requires Cowork desktop with an outputs directory for delivering the generated .plugin file.',
    'cowork-cowork-plugin-customizer': 'The publisher requires Cowork desktop with access to its mounted plugin directories. Available connectors and commands depend on the target workspace.',
    'anthropic-schedule': 'Scheduled runs use the Cowork scheduler and the capabilities enabled for that account.',
    'anthropic-setup-cowork': 'This guide configures the Cowork product and its available workspace features.',
    'impeccable': 'Install the distribution for your host. Its optional automatic checks use hooks, and command setup differs by agent.',
    'ponytail': 'Lifecycle hooks, commands and persistence vary by host. See the publisher’s installation notes for your agent.',
    'rea': 'The documented integrations pair the agent with a local MCP server and matching workflow instructions.',
    'gws-drive': 'The agent skill calls the authenticated gws CLI. The active Google account needs the requested Drive permissions.',
    'gws-gmail': 'The agent skill calls the authenticated gws CLI. The active Google account needs the requested Gmail permissions.',
};

// These compact listings publish a complete SKILL.md with ordinary frontmatter.
// Their text or Markdown deliverable can be produced from a supplied brief, notes, or data.
// No companion executable, connector, referenced template, or host-specific hook is required.
export const portableSkillSlugs: string[] = [
    'design-design-critique', 'design-ux-copy', 'design-research-synthesis',
    'design-design-handoff', 'design-design-system', 'design-user-research',
    'ux-flow-wireframer', 'ux-research-interview-kit', 'persona-workshop-facilitator',
    'b2b-value-proposition-mapper', 'founder-pitch-deck-coach',
    'marketing-campaign-plan', 'marketing-email-sequence', 'marketing-performance-report',
];

export const portableSkillHosts: { agent: string; source: string }[] = [
    { agent: 'Claude Code', source: 'https://code.claude.com/docs/en/skills' },
    { agent: 'Codex', source: 'https://learn.chatgpt.com/docs/build-skills' },
    { agent: 'Gemini CLI', source: 'https://geminicli.com/docs/cli/skills/' },
    { agent: 'GitHub Copilot', source: 'https://docs.github.com/en/copilot/concepts/agents/about-agent-skills' },
    { agent: 'Cursor', source: 'https://cursor.com/docs/context/skills' },
];
