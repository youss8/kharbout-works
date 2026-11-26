import translations from '../data/catalogue-translations.json';
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

const categoryNames: Record<
    CatalogueEntry['category'],
    Record<'de' | 'ar', string>
> = translations.categories;

export function categoryLabel(category: CatalogueEntry['category'], locale: Locale): string {
    return locale === 'en' ? category : categoryNames[category][locale];
}

type Text = Pick<CatalogueEntry, 'title' | 'summary'>;
const translatedEntries: Record<string, Record<'de' | 'ar', Text>> = translations.entries;

const translatedRequirements: Record<
    string,
    Record<'de' | 'ar', string>
> = translations.requirements;

export function localizeEntry<T extends CatalogueEntry>(entry: T, locale: Locale): T {
    if (locale === 'en') return entry;
    return {
        ...entry,
        ...translatedEntries[entry.slug]?.[locale],
        requirements: entry.requirements.map(
            (item) => translatedRequirements[item]?.[locale] ?? item,
        ),
    };
}
