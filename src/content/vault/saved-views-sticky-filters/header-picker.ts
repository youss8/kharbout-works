type Choice = { value: string; label: string; disabled: boolean };
type PickerOptions = { read: () => readonly string[]; commit: (selected: string[]) => void };
/** Options remain native <option> elements at the call site. Only Done commits the local draft. */
export function mountHeaderPicker(host: HTMLElement, { read, commit }: PickerOptions) {
    const source = host.querySelector('select')!;
    const trigger = host.querySelector<HTMLButtonElement>('[data-trigger]')!;
    const panel = document.createElement('div');
    panel.popover = 'auto';
    panel.className = 'header-options';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', trigger.getAttribute('aria-label') ?? 'Header filter');
    const search = document.createElement('input');
    search.type = 'search';
    search.setAttribute('aria-label', host.dataset.searchLabel ?? 'Find option');
    const list = document.createElement('div');
    list.className = 'header-results';
    const actions = document.createElement('div');
    actions.className = 'kit-row';
    const action = (text: string, run: () => void) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.addEventListener('click', run);
        actions.append(button);
    };
    let draft: string[] = [],
        options: Choice[] = [];
    const close = () => {
        panel.hidePopover();
        trigger.focus();
    };
    function render(focusValue?: string) {
        list.replaceChildren();
        const matched = options.filter((o) =>
            o.label.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()),
        );
        if (!matched.length) {
            const p = document.createElement('p');
            p.textContent = 'No matching options.';
            list.append(p);
        }
        for (const option of matched) {
            const label = document.createElement('label'),
                input = document.createElement('input');
            input.type = source.multiple ? 'checkbox' : 'radio';
            input.checked = draft.includes(option.value);
            input.disabled = option.disabled;
            input.value = option.value;
            input.addEventListener('change', () => {
                draft = source.multiple
                    ? options
                          .filter((o) =>
                              o.value === option.value ? input.checked : draft.includes(o.value),
                          )
                          .map((o) => o.value)
                    : [option.value];
                render(option.value);
            });
            const text = document.createElement('span');
            text.textContent = option.label;
            label.append(input, text);
            list.append(label);
            if (option.value === focusValue) input.focus();
        }
    }
    function place() {
        const bounds = trigger.getBoundingClientRect();
        const w = window.innerWidth,
            h = window.innerHeight,
            rtl = getComputedStyle(host).direction === 'rtl';
        const start = Math.max(
            6,
            Math.min(rtl ? w - bounds.right : bounds.left, w - panel.offsetWidth - 6),
        );
        panel.style.insetInlineStart = start + 'px';
        const below = h - bounds.bottom - 6;
        panel.style.insetBlockStart =
            (below >= panel.offsetHeight
                ? bounds.bottom
                : Math.max(6, bounds.top - panel.offsetHeight)) + 'px';
    }
    const open = () => {
        if (panel.matches(':popover-open')) {
            close();
            return;
        }
        options = Array.from(source.options, (o) => ({
            value: o.value,
            label: o.label,
            disabled: o.disabled,
        }));
        draft = [...read()];
        search.value = '';
        render();
        panel.showPopover();
        place();
        search.focus();
        trigger.setAttribute('aria-expanded', 'true');
    };
    action('Clear', () => {
        draft = source.multiple ? [] : [source.dataset.default ?? ''];
        render();
        search.focus();
    });
    action('Cancel', close);
    action('Done', () => {
        commit(draft);
        close();
    });
    panel.addEventListener('toggle', () =>
        trigger.setAttribute('aria-expanded', String(panel.matches(':popover-open'))),
    );
    panel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            close();
            return;
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const enabled = Array.from(
                list.querySelectorAll<HTMLInputElement>('input:not(:disabled)'),
            );
            if (!enabled.length) return;
            const index = enabled.indexOf(document.activeElement as HTMLInputElement);
            const dest =
                index < 0
                    ? e.key === 'ArrowDown'
                        ? 0
                        : enabled.length - 1
                    : (index + (e.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
            enabled[dest].focus();
        } else if (e.target === search && e.key.length === 1) {
            e.stopPropagation();
        }
    });
    search.addEventListener('input', () => render());
    panel.append(search, list, actions);
    host.append(panel);
    trigger.addEventListener('click', open);
    const reposition = () => {
        if (panel.matches(':popover-open')) place();
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    const dismiss = () => {
        if (panel.matches(':popover-open')) panel.hidePopover();
    };
    host.addEventListener('reset-header-draft', dismiss);
    return () => {
        trigger.removeEventListener('click', open);
        host.removeEventListener('reset-header-draft', dismiss);
        window.removeEventListener('resize', reposition);
        window.removeEventListener('scroll', reposition, true);
        panel.remove();
    };
}
