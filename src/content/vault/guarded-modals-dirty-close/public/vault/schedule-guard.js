/**
 * The editor owns one same-document history entry. Back dismisses it; a dirty editor asks first.
 * Cross-document navigation and reload use the browser's native beforeunload confirmation.
 * @param {{dirty:()=>boolean,pending:()=>boolean,requestDiscard:()=>void,close:(proceed?:boolean)=>void}} callbacks
 */
export function scheduleGuard(callbacks) {
    const key = '__vaultScheduleEditor';
    const token = crypto.randomUUID?.() ?? String(performance.timeOrigin + performance.now());
    let active = false;
    /** @type {string|null} */
    let destination = null;
    const marked = () => history.state?.[key] === token;
    function push() {
        history.pushState({ ...history.state, [key]: token }, '', location.href);
    }
    /** @param {BeforeUnloadEvent} event */
    function beforeUnload(event) {
        if (active && (callbacks.dirty() || callbacks.pending())) {
            event.preventDefault();
        }
    }
    /** @param {MouseEvent} event */
    function linkClick(event) {
        if (
            !active ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.altKey ||
            event.shiftKey
        )
            return;
        const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
        if (
            !(link instanceof HTMLAnchorElement) ||
            link.download ||
            (link.target && link.target !== '_self')
        )
            return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (callbacks.pending()) return;
        destination = link.href;
        if (callbacks.dirty()) callbacks.requestDiscard();
        else callbacks.close(true);
    }
    function pop() {
        if (!active || marked()) return;
        if (callbacks.dirty() || callbacks.pending()) {
            push();
            if (!callbacks.pending()) {
                destination = null;
                callbacks.requestDiscard();
            }
        } else callbacks.close();
    }
    function unbind() {
        window.removeEventListener('beforeunload', beforeUnload);
        window.removeEventListener('popstate', pop);
        document.removeEventListener('click', linkClick, true);
    }
    return {
        begin() {
            if (active) return;
            active = true;
            destination = null;
            push();
            window.addEventListener('popstate', pop);
            window.addEventListener('beforeunload', beforeUnload);
            document.addEventListener('click', linkClick, true);
        },
        stay() {
            destination = null;
        },
        end(proceed = false) {
            if (!active) return;
            active = false;
            unbind();
            const href = proceed ? destination : null;
            destination = null;
            if (marked()) {
                if (href)
                    window.addEventListener('popstate', () => location.assign(href), {
                        once: true,
                    });
                history.back();
            } else if (href) location.assign(href);
        },
        destroy() {
            active = false;
            destination = null;
            unbind();
        },
    };
}

/** Normalize scalar form values without losing significant leading zeroes.
 * @param {string|number} hours
 * @param {(string|number)[]} days
 * @param {string} startTime
 * @returns {{hours:string,days:string[],startTime:string}}
 */
export function normalizeSchedule(hours, days, startTime) {
    return {
        hours: String(hours ?? '').trim(),
        days: [...new Set(days.map(String))].sort(),
        startTime: String(startTime ?? '')
            .trim()
            .replace(/^((?:[01]\d|2[0-3]):[0-5]\d):00$/, '$1'),
    };
}
