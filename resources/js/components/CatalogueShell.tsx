import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { isLocale, useLocale } from '../i18n';
import CatalogueSearch from './CatalogueSearch';
import type { VaultSearch } from './CatalogueSearch';

export default function CatalogueShell({
    children,
    home = false,
    vault,
}: {
    children: ReactNode;
    home?: boolean;
    vault?: VaultSearch;
}) {
    const { locale, t, setLocale } = useLocale();
    return (
        <>
            <a className="skip-link" href="#main-content">
                {t('Skip to content', 'Zum Inhalt springen', 'انتقل إلى المحتوى')}
            </a>
            <header className="site-header">
                <div className="shell masthead">
                    <Link
                        href="/"
                        className="brand"
                        aria-label={t(
                            'Youssef’s Operations Kit home',
                            'Youssef’s Operations Kit – Startseite',
                            'الصفحة الرئيسية لمجموعة أدوات يوسف',
                        )}
                    >
                        <span className="brand-mark" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                        </span>
                        <bdi dir="ltr">Youssef’s Operations Kit</bdi>
                    </Link>
                    <nav aria-label={t('Main navigation', 'Hauptnavigation', 'التنقّل الرئيسي')}>
                        <CatalogueSearch vault={vault} />
                        <Link href="/" aria-current={home ? 'page' : undefined}>
                            {t('Catalogue', 'Katalog', 'الفهرس')}
                        </Link>
                        {vault && <a href="#ai-vault">{t('Vault', 'Vault', 'خزانة الأدوات')}</a>}
                        <a href="https://github.com/youss8/youssef-operations-kit">
                            GitHub <span aria-hidden="true">↗</span>
                        </a>
                        <select
                            className="language-select"
                            aria-label={t('Language', 'Sprache', 'اللغة')}
                            value={locale}
                            onChange={(event) => {
                                if (isLocale(event.target.value)) setLocale(event.target.value);
                            }}
                        >
                            <option value="en" lang="en">
                                English
                            </option>
                            <option value="de" lang="de">
                                Deutsch
                            </option>
                            <option value="ar" lang="ar">
                                العربية
                            </option>
                        </select>
                    </nav>
                </div>
            </header>
            <main id="main-content" className="shell main-content" tabIndex={-1}>
                {children}
            </main>
            <footer className="shell site-footer">
                <span>Youssef’s Operations Kit</span>
                <a href="https://github.com/youss8/youssef-operations-kit/blob/main/LICENSE">
                    {t('MIT License', 'MIT-Lizenz', 'رخصة MIT')} <span aria-hidden="true">↗</span>
                </a>
            </footer>
        </>
    );
}
