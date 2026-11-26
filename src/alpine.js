import Alpine from 'alpinejs';
import registerAsk from './components/layout/ask-palette';

async function start() {
    registerAsk(Alpine);
    const features = [
        [
            '[x-data="leaveDesk"], [x-data="attendanceDesk"]',
            () => import('./components/demos/hr-alpine.js'),
        ],
        [
            '[x-data="kpiCockpit"], [x-data="fundingFlow"]',
            () => import('./components/demos/portfolio-alpine.js'),
        ],
        [
            '[x-data="datePlanner"], [x-data="habitTracker"], [x-data="mealBuilder"]',
            () => import('./components/lab/prototypes.js'),
        ],
        ['[x-data="promptBuilder"]', () => import('./lib/prompt-builder/workspace')],
    ];
    await Promise.all(
        features.map(async ([selector, load]) => {
            const roots = document.querySelectorAll(selector);
            if (!roots.length) return;
            try {
                (await load()).default(Alpine);
            } catch {
                for (const root of roots) {
                    root.setAttribute('x-ignore', '');
                    root.removeAttribute('x-cloak');
                    const message = document.createElement('p');
                    message.setAttribute('role', 'alert');
                    message.textContent =
                        'This interactive section could not load. Reload the page to try again.';
                    root.replaceChildren(message);
                }
            }
        }),
    );
    window.Alpine = Alpine;
    Alpine.start();
}

void start();
