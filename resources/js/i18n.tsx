import { createContext, useContext, useLayoutEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { CatalogueEntry } from './catalogue';

export type Locale = 'en' | 'de' | 'ar';
const storageKey = 'operations-kit.locale';
const changeEvent = 'kit:locale';

export function isLocale(value: unknown): value is Locale {
    return value === 'en' || value === 'de' || value === 'ar';
}

function readSavedLocale(): Locale {
    try {
        const saved = window.localStorage.getItem(storageKey);
        return isLocale(saved) ? saved : 'en';
    } catch {
        return 'en';
    }
}

let currentLocale: Locale = typeof window === 'undefined' ? 'en' : readSavedLocale();

function setLocale(locale: Locale) {
    currentLocale = locale;
    try {
        window.localStorage.setItem(storageKey, locale);
    } catch {
        // The in-memory preference still applies when persistent storage is unavailable.
    }
    window.dispatchEvent(new Event(changeEvent));
}

function subscribe(notify: () => void) {
    function syncFromOtherTab(event: StorageEvent) {
        if (event.key !== storageKey && event.key !== null) return;
        currentLocale = readSavedLocale();
        notify();
    }
    window.addEventListener(changeEvent, notify);
    window.addEventListener('storage', syncFromOtherTab);
    return () => {
        window.removeEventListener(changeEvent, notify);
        window.removeEventListener('storage', syncFromOtherTab);
    };
}

const LocaleContext = createContext<Locale>('en');

export function LocaleProvider({ children }: { children: ReactNode }) {
    const locale = useSyncExternalStore(
        subscribe,
        () => currentLocale,
        () => 'en' as const,
    );
    useLayoutEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }, [locale]);
    return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
    const locale = useContext(LocaleContext);
    function t(en: string, de: string, ar: string) {
        return { en, de, ar }[locale];
    }
    return { locale, setLocale, t };
}

const categoryNames: Record<CatalogueEntry['category'], Record<'de' | 'ar', string>> = {
    Components: { de: 'Komponenten', ar: 'المكوّنات' },
    Pages: { de: 'Seiten', ar: 'الصفحات' },
    Utilities: { de: 'Hilfsfunktionen', ar: 'الدوال المساعدة' },
    Modules: { de: 'Module', ar: 'الوحدات' },
    'AI tools': { de: 'KI-Werkzeuge', ar: 'أدوات الذكاء الاصطناعي' },
};

export function categoryLabel(category: CatalogueEntry['category'], locale: Locale): string {
    return locale === 'en' ? category : categoryNames[category][locale];
}

type Text = Pick<CatalogueEntry, 'title' | 'summary'>;
const translatedEntries: Record<string, Record<'de' | 'ar', Text>> = {
    'search-dialog': {
        de: {
            title: 'Suchdialog mit Tastatursteuerung',
            summary:
                'Durchsuche eine Liste, wechsle mit den Pfeiltasten zwischen Treffern und öffne ein Ergebnis mit der Eingabetaste.',
        },
        ar: {
            title: 'مربع البحث بلوحة المفاتيح',
            summary:
                'ابحث في قائمة، وتنقّل بين النتائج بمفاتيح الأسهم، ثم افتح النتيجة المطلوبة بمفتاح الإدخال.',
        },
    },
    'keyboard-shortcut-label': {
        de: {
            title: 'Tastenkürzel anzeigen',
            summary: 'Zeige einen Befehl zusammen mit seinem Tastenkürzel an.',
        },
        ar: {
            title: 'عرض اختصار لوحة المفاتيح',
            summary: 'اعرض اختصار لوحة المفاتيح بجانب اسم الأمر الذي ينفّذه.',
        },
    },
    'copy-code': {
        de: {
            title: 'Code kopieren',
            summary:
                'Kopiere Code mit der Tastatur oder per Klick. Wenn der Browser das Kopieren verweigert, erscheint ein Hinweis.',
        },
        ar: {
            title: 'نسخ الشيفرة',
            summary:
                'انسخ الشيفرة كما تظهر باستخدام الفأرة أو لوحة المفاتيح، واحصل على تنبيه إذا تعذّر النسخ.',
        },
    },
    'empty-state-page': {
        de: {
            title: 'Leere Suchergebnisse',
            summary: 'Hilf Besuchern weiter, wenn keine Einträge zu ihrer Suche passen.',
        },
        ar: {
            title: 'صفحة البحث بلا نتائج',
            summary: 'ساعد الزائر على متابعة التصفّح عندما لا يعثر على نتائج لبحثه.',
        },
    },
    'url-filters': {
        de: {
            title: 'Teilbare URL-Filter',
            summary:
                'Speichere Suchbegriff und Kategorie in einem Link, den du teilen oder als Lesezeichen ablegen kannst.',
        },
        ar: {
            title: 'مرشّحات بحث قابلة للمشاركة',
            summary: 'احفظ عبارة البحث والفئة في رابط واحد يمكنك مشاركته أو إضافته إلى المفضّلة.',
        },
    },
    'catalogue-search': {
        de: {
            title: 'Suchendpunkt für den Katalog',
            summary:
                'Validiere Suchanfragen mit Laravel und liefere passende Katalogeinträge als JSON zurück.',
        },
        ar: {
            title: 'واجهة البحث في الفهرس',
            summary: 'تحقّق من طلب البحث في Laravel وأعد العناصر المطابقة بصيغة JSON.',
        },
    },
    'accessible-ui-review': {
        de: {
            title: 'Barrierefreiheit prüfen',
            summary:
                'Prüfe eine Oberfläche mit einem Claude-Skill oder Gemini-Gem und halte nachvollziehbare Befunde fest.',
        },
        ar: {
            title: 'مراجعة إمكانية الوصول',
            summary:
                'راجع واجهة باستخدام مهارة Claude أو أداة Gemini Gem، وسجّل ملاحظات يستطيع المطوّر التحقّق منها.',
        },
    },
};

export function localizeEntry<T extends CatalogueEntry>(entry: T, locale: Locale): T {
    if (locale === 'en') return entry;
    return {
        ...entry,
        ...translatedEntries[entry.slug]?.[locale],
        requirements: entry.requirements.map((item) =>
            item === 'Claude Code or Gemini Gems'
                ? locale === 'ar'
                    ? 'Claude Code أو Gemini Gems'
                    : 'Claude Code oder Gemini Gems'
                : item,
        ),
    };
}
