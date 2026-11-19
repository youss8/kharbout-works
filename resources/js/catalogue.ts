export const shortcutEntry = {
    title: 'Keyboard shortcut label',
    href: '/entries/keyboard-shortcut-label',
    summary: 'Put a command and its keyboard shortcut side by side.',
} as const;

export const collections = [
    { name: 'Components', description: 'Reusable interface elements.', glyph: '▦' },
    { name: 'Pages', description: 'Complete page layouts.', glyph: '▤' },
    { name: 'Utilities', description: 'JavaScript and TypeScript helpers.', glyph: 'ƒ' },
    { name: 'Modules', description: 'End-to-end workflows.', glyph: '⊞' },
    { name: 'AI tools', description: 'Skills, Gems and instructions.', glyph: '✳' },
] as const;
