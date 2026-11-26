export const searchScopes = [
    { label: 'All', kinds: [] },
    { label: 'Demos', kinds: ['Sandbox', 'Prototype'] },
    { label: 'Vault', kinds: ['Vault'] },
    { label: 'Prompts', kinds: ['Prompt', 'gem', 'skill', 'workflow'] },
    { label: 'Skill guides', kinds: ['Skill guide'] },
] as const;
