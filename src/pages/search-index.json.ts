import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import type { CommandIndex, SearchEntry } from '../data/command-index';
import { vaultAliases } from '../data/command-index';
import { profile } from '../data/profile';
import { labProjects } from '../data/lab';
import { sandboxTitles } from '../data/sandbox-directory';

const pages = [
    [
        '/',
        'Engineering workbench',
        'Youssef Kharbout’s profile, availability and systems overview.',
    ],
    [
        '/systems/',
        'Systems comparison',
        'Compare ownership, scale, data models and access controls.',
    ],
    [
        '/vault/',
        'Component vault',
        'Explore 20 interactive kits with Alpine, React and Livewire source.',
    ],
    [
        '/ai-kit/',
        'AI engineering toolkit',
        'Compile and download Gems, coding skills and workflows.',
    ],
    [
        '/templates/',
        'Operations templates',
        'Architecture, planning, operations and technical handovers.',
    ],
    ['/lab/', 'R&D lab', 'Four interactive personal prototypes.'],
    [
        '/cv/',
        'Interactive CV',
        'International and DACH formats, employer override and A4 PDF printing.',
    ],
];
const pageAliases: Record<string, string[]> = {
    '/': ['الصفحة الرئيسية', 'نبذة عن يوسف'],
    '/systems/': ['الأنظمة', 'دراسات الحالة', 'مقارنة الأنظمة'],
    '/vault/': ['مكتبة المكونات', 'خزنة المكونات', 'أمثلة تفاعلية'],
    '/ai-kit/': ['الذكاء الاصطناعي', 'أدوات هندسية', 'قوالب الأوامر'],
    '/templates/': ['نماذج التشغيل', 'القوالب', 'التسليم الفني'],
    '/lab/': ['المختبر', 'تجارب ونماذج أولية'],
    '/cv/': ['السيرة الذاتية', 'السيرة المهنية', 'طباعة'],
};
const sourceAliases: Record<string, string[]> = {
    'SYS-01': ['IT', 'helpdesk', 'الدعم الفني', 'إدارة الأصول'],
    'SYS-02': ['HR', 'pre-RMS', 'الموارد البشرية', 'شؤون الموظفين'],
    'SYS-03': ['PT', 'project tracking', 'تتبع المشاريع', 'مؤشرات الأداء'],
    'Cross-System': ['cross-system', 'مشترك بين الأنظمة'],
};
const tiers = ['Primitives', 'Controls & Guards', 'Workflows', 'Flagship Engines'];
const sandboxKeywords: Record<string, string[]> = {
    'service-desk': [
        'SLA',
        'React',
        'queue',
        'ticket',
        'first response',
        'طلب دعم',
        'تذاكر متأخرة',
    ],
    'estate-overview': [
        'React',
        'RLS',
        'telemetry',
        'patch panel',
        'endpoint',
        'availability',
        'مراقبة الأجهزة',
    ],
    'leave-engine': [
        'leave',
        'refund',
        'approval',
        'HR',
        'Laravel',
        'Alpine',
        'تسعير الإجازات',
        'اعتماد الإجازة',
    ],
    'attendance-amend': [
        'asSigned',
        'contract',
        'overtime',
        'redaction',
        'Laravel',
        'Alpine',
        'تعديل العقد',
        'الحضور',
    ],
    'kpi-cockpit': [
        'pooled ratio',
        'denominator',
        'rollup',
        'KPI',
        'Laravel',
        'Alpine',
        'النسبة المجمعة',
        'مؤشرات الأداء',
    ],
    'funding-flow': [
        'Sankey',
        'tranche',
        'agreement',
        'currency',
        'Laravel',
        'Alpine',
        'دفعات التمويل',
    ],
};

export const GET: APIRoute = async () => {
    const [systems, vault, ai, templates] = await Promise.all([
        getCollection('systems'),
        getCollection('vault'),
        getCollection('ai-kit'),
        getCollection('templates'),
    ]);
    const entries: SearchEntry[] = pages.map(([href, title, summary]) => ({
        group: 'pages',
        kind: 'Page',
        title,
        summary,
        href,
        keywords: pageAliases[href],
    }));
    const byCode = new Map<string, string>();
    const bySandbox = new Map<string, string>();
    for (const project of labProjects) {
        entries.push({
            group: 'pages',
            kind: 'Prototype',
            title: project.title,
            summary: project.summary,
            href: '/lab/#' + project.id,
            keywords: [project.id, 'R&D', 'lab'],
        });
    }
    for (const { id, data } of systems.sort((a, b) => a.data.order - b.data.order)) {
        const href = '/systems/' + id + '/';
        byCode.set(data.code, href);
        entries.push({
            group: 'pages',
            kind: data.code,
            title: data.title,
            summary: data.scopeNote,
            href,
            keywords: [
                data.code,
                data.ecosystem,
                data.ownershipBadge,
                ...data.stack,
                ...(sourceAliases[data.code] ?? []),
            ],
        });
        for (const demoId of data.demoIds) {
            const target = href + '#' + demoId;
            bySandbox.set(demoId, target);
            entries.push({
                group: 'pages',
                kind: 'Sandbox',
                title: sandboxTitles[demoId],
                summary: data.code + ' · ' + data.title,
                href: target,
                keywords: [demoId, ...(sandboxKeywords[demoId] ?? [])],
            });
        }
    }
    for (const { id, data } of vault.sort((a, b) => a.data.order - b.data.order)) {
        const provenance =
            data.provenance === 'observed'
                ? 'Observed in Codebase'
                : 'Observed + Clean-Room [spec]';
        entries.push({
            group: 'assets',
            kind: 'Vault',
            title: data.title,
            summary: data.summary,
            href: '/vault/#' + id,
            tier: data.tier,
            category: data.category,
            provenance: data.provenance,
            sourceSystems: data.sourceSystems,
            keywords: [
                id,
                'T' + data.tier,
                'tier ' + data.tier,
                ...data.sourceIds,
                tiers[data.tier - 1],
                data.category,
                provenance,
                data.provenance,
                ...data.sourceSystems.flatMap((code) => [code, ...sourceAliases[code]]),
                'RTL',
                'React',
                'Alpine',
                'Livewire',
                ...(vaultAliases[id] ?? []),
            ],
        });
    }
    for (const { id, data } of ai.sort((a, b) => a.data.order - b.data.order)) {
        entries.push({
            group: 'assets',
            kind: data.kind,
            title: data.title,
            summary: data.summary,
            href: '/ai-kit/#' + data.id,
            keywords: [id, data.kind, data.category, ...data.compatibility],
        });
    }
    for (const { id, data } of templates.sort((a, b) => a.data.order - b.data.order)) {
        entries.push({
            group: 'assets',
            kind: 'Template',
            title: data.title,
            summary: data.summary,
            href: '/templates/#' + data.id,
            keywords: [id, data.category, ...data.formats],
        });
    }
    const index: CommandIndex = {
        entries,
        intents: [
            {
                terms: [
                    'cv',
                    'resume',
                    'résumé',
                    'pdf',
                    'print',
                    'السيرة الذاتية',
                    'السيرة المهنية',
                    'طباعة',
                ],
                title: 'Open the print-ready CV',
                summary: 'Choose International or DACH, then Print / Save PDF.',
                href: '/cv/',
            },
            {
                terms: [
                    'germany',
                    'relocate',
                    'relocation',
                    'dach',
                    'german',
                    'الانتقال إلى ألمانيا',
                    'التوفر للعمل',
                ],
                title: 'Germany relocation and availability',
                summary: `${profile.availability.mobility} · Available ${profile.availability.month}.`,
                href: '/cv/',
            },
            {
                terms: ['email', 'contact', 'hire', 'reach', 'تواصل', 'البريد الإلكتروني', 'توظيف'],
                title: 'Email Youssef',
                summary: profile.contact.email,
                href: 'mailto:' + profile.contact.email,
            },
            {
                terms: ['solo', 'ownership', 'ملكية النظام', 'مطور منفرد'],
                title: 'Which system was built solo?',
                summary:
                    'SYS-01 was 100% solo, architecture-verified and held from live fleet rollout.',
                href: byCode.get('SYS-01'),
            },
            {
                terms: ['react', 'typescript', 'ريأكت', 'تايب سكريبت'],
                title: 'Explore the React service desk',
                summary: 'Inspect a ticket, change its state and verify its SLA.',
                href: bySandbox.get('service-desk'),
            },
            {
                terms: ['laravel', 'livewire', 'php', 'لارافيل', 'لايف واير'],
                title: 'Explore the Laravel HR case study',
                summary: 'Three-developer team. Youssef co-architected the pre-RMS core.',
                href: byCode.get('SYS-02'),
            },
            {
                terms: ['rls', 'postgres', 'permissions', 'صلاحيات الوصول', 'أمن الصفوف'],
                title: 'How are IT records scoped?',
                summary: 'PostgreSQL row-level security covers all 47 tables in SYS-01.',
                href: byCode.get('SYS-01') + '#permissions',
            },
            {
                terms: ['pooled', 'ratio', 'denominator', 'النسبة المجمعة', 'المقام'],
                title: 'Inspect the pooled KPI ratio',
                summary:
                    'Compare pooled numerators and denominators with the average of percentages.',
                href: bySandbox.get('kpi-cockpit'),
            },
            {
                terms: ['sankey', 'tranche', 'funding', 'تتبع التمويل', 'دفعات', 'سانكي'],
                title: 'Trace funding through the Sankey',
                summary: 'Follow sponsors, proposals and projects, then mark a tranche received.',
                href: bySandbox.get('funding-flow'),
            },
            {
                terms: ['rtl', 'direction', 'bidi', 'من اليمين إلى اليسار', 'اتجاه الكتابة'],
                title: 'Test right-to-left layouts',
                summary: 'Open the component vault and switch the isolated preview to RTL.',
                href: '/vault/',
            },
            {
                terms: ['dark', 'light', 'theme', 'داكن', 'فاتح', 'المظهر', 'الوضع الليلي'],
                title: 'Switch theme',
                summary: 'Change the workbench theme on this device.',
                action: 'theme',
            },
            {
                terms: ['late', 'overdue', 'breached', 'متأخر', 'متأخرة', 'تذاكر متأخرة'],
                title: 'Review overdue service requests',
                summary: 'Open the SLA queue and choose Breached to inspect late tickets.',
                href: bySandbox.get('service-desk'),
            },
            {
                terms: ['new', 'create', 'new ticket', 'new request', 'طلب جديد', 'إنشاء تذكرة'],
                title: 'Start a service request',
                summary: 'Open the service desk and select New request.',
                href: bySandbox.get('service-desk'),
            },
            {
                terms: ['mit', 'license', 'licence', 'رخصة', 'ترخيص'],
                title: 'Read the MIT license',
                summary: 'View the repository’s reuse and copyright terms.',
                href: profile.contact.repoUrl + '/blob/main/LICENSE',
            },
        ],
    };
    return Response.json(index);
};
