export type SearchGroup = 'pages' | 'assets';

export interface SearchEntry {
    group: SearchGroup;
    kind: string;
    title: string;
    summary: string;
    href: string;
    keywords: string[];
    tier?: 1 | 2 | 3 | 4;
    category?: string;
    provenance?: 'observed' | 'observed-plus-spec';
    sourceSystems?: string[];
}

export interface SearchIntent {
    terms: string[];
    title: string;
    summary: string;
    href?: string;
    action?: 'theme';
}

export interface CommandIndex {
    entries: SearchEntry[];
    intents: SearchIntent[];
}

// Search terms include the names used in the source systems and in Arabic interfaces.
export const vaultAliases: Record<string, string[]> = {
    'status-tone-vocabulary': [
        'status vocabulary primitives',
        'urgent priority',
        'severity rating',
        'الأولوية',
        'حالات العمل',
        'درجة الخطورة',
    ],
    'two-band-progress-sla': [
        'approved pending delivery',
        'over delivery',
        'service level agreement',
        'إنجاز',
        'مؤشر التقدم',
        'مهلة الاستجابة',
    ],
    'currency-guard-balance': [
        'currency guard',
        'paid leave hours',
        'overtime credit',
        'العملات',
        'رصيد الإجازات',
        'ساعات إضافية',
    ],
    'zero-safe-signal-tiles': [
        'slice KPI tiles',
        'breached queue',
        'signal counts',
        'مؤشرات الطابور',
        'عداد الطلبات',
        'تجاوز المهلة',
    ],
    'redacted-pay-day-state': [
        'redacted salary',
        'attendance day chips',
        'withheld pay',
        'حجب الراتب',
        'حالات الحضور',
        'أيام الدوام',
    ],
    'shared-options-popover': [
        'task assignee options',
        'single shared popover',
        'إسناد المهام',
        'دليل الموظفين',
        'اختيار المسؤول',
    ],
    'saved-views-sticky-filters': [
        'saved views',
        'sticky filters',
        'table filter presets',
        'طرق العرض المحفوظة',
        'تصفية الجدول',
        'مرشحات',
    ],
    'guarded-modals-dirty-close': [
        'dirty modal guard',
        'typed confirmation',
        'required note',
        'تأكيد الحذف',
        'تغييرات غير محفوظة',
        'ملاحظة إلزامية',
    ],
    'failure-honest-boundaries': [
        'retry loading state',
        'safe CSV export',
        'formula injection prevention',
        'إعادة المحاولة',
        'فشل التحميل',
        'تصدير آمن',
    ],
    'office-pdf-preview': [
        'spreadsheet document viewer',
        'private file preview',
        'معاينة المستندات',
        'عرض الجداول',
        'ملفات المكتب',
    ],
    'fail-closed-role-drawer': [
        'role switcher',
        'record unavailable',
        'permission guard',
        'تبديل الدور',
        'صلاحيات الموظف',
        'تفاصيل السجل',
    ],
    'bilingual-ask-palette': [
        'command ask bar',
        'monthly site returns',
        'wrong keyboard layout',
        'العائدات الشهرية',
        'بحث ثنائي اللغة',
        'كان',
    ],
    'status-gate-lifecycle': [
        'approval stepper checklist',
        'guarded workflow kanban',
        'proposal stage gate',
        'دورة حياة المقترح',
        'مراحل الموافقة',
        'تعارض التعديلات',
    ],
    'needs-action-inbox': [
        'needs action digest',
        'versioned work inbox',
        'approval undo',
        'صندوق العمل',
        'طلبات الموافقة',
        'التراجع عن القرار',
    ],
    'spreadsheet-importer-register': [
        'config driven register',
        'spreadsheet import',
        'header mapping',
        'استيراد الجداول',
        'سجل المهام',
        'مطابقة الأعمدة',
    ],
    'amendment-diff-org-chart': [
        'asSigned contract amendment',
        'dual line org chart',
        'العقد الأصلي',
        'ملاحق العقود',
        'الهيكل التنظيمي',
    ],
    'flush-row-desk-grid': [
        'flush row packing',
        'dashboard grid resize',
        'لوحة التحكم',
        'ترتيب البطاقات',
        'تخصيص مساحة العمل',
    ],
    'html-svg-sankey-flow': [
        'sankey funding trace',
        'sponsor project register',
        'مخطط سانكي',
        'تدفقات التمويل',
        'تتبع المنح',
    ],
    'patch-panel-estate-strip': [
        'patch panel strip',
        'endpoint telemetry',
        'branch outage',
        'لوحة التوصيل',
        'أجهزة الفروع',
        'مراقبة الشبكة',
    ],
    'gantt-and-timesheet-machines': [
        'gantt dependency ripple',
        'timesheet month',
        'مخطط جانت',
        'الجدول الزمني',
        'سجل الدوام الشهري',
    ],
};
