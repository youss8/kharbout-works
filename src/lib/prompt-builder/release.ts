export function promptBuilderEnabled(): boolean {
    const setting = process.env.PROMPT_BUILDER_ENABLED;
    return setting === 'true' || (setting !== 'false' && !process.env.VERCEL && !process.env.CF_PAGES);
}
