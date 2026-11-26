export function bindSourceCopy(container: HTMLElement) {
    const feedback = container.querySelector<HTMLElement>('.feedback')!;
    const manual = container.querySelector<HTMLLabelElement>('.manual-copy')!;
    const copy = async (source: string) => {
        manual.hidden = true;
        try {
            await navigator.clipboard.writeText(source);
            feedback.textContent = 'Source copied.';
        } catch {
            const field = manual.querySelector('textarea')!;
            manual.hidden = false;
            field.value = source;
            field.focus();
            field.select();
            feedback.textContent = 'Source selected for manual copy.';
        }
    };
    container.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest('[data-copy-file]');
        const code = button?.closest('section')?.querySelector('pre code')?.textContent;
        if (code) void copy(code);
    });
    return copy;
}
