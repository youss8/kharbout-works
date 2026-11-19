import { useState } from 'react';
import type { ReactNode } from 'react';
import emptyPage from '../../../kit/pages/empty-state-page/index.html?raw';
import { writeFilters } from '../../../kit/utilities/url-filters/filters';
import filterSource from '../../../kit/utilities/url-filters/filters.ts?raw';
import moduleRoute from '../../../kit/modules/catalogue-search/routes.php?raw';
import moduleData from '../../../kit/modules/catalogue-search/entries.php?raw';
import skill from '../../../kit/ai-tools/accessible-ui-review/SKILL.md?raw';
import gem from '../../../kit/ai-tools/accessible-ui-review/gem-instructions.md?raw';
import { useLocale } from '../i18n';
import CodeExample from './CodeExample';
import CopyCodeRecipe from './CopyCodeRecipe';
import SearchDialogRecipe from './SearchDialogRecipe';
import ShortcutRecipe from './ShortcutRecipe';
import '../../css/kit-recipe.css';

function Source({ label, code }: { label: string; code: string }) {
    return (
        <details className="recipe-source">
            <summary>{label}</summary>
            <CodeExample label={label} code={code} />
        </details>
    );
}

function Recipe({
    preview,
    instructions,
    requirements,
    check,
    children,
}: {
    preview: ReactNode;
    instructions: ReactNode;
    requirements: string;
    check: string;
    children: ReactNode;
}) {
    const { t } = useLocale();
    return (
        <div className="entry-content">
            <section className="entry-section" aria-labelledby="preview-title">
                <h2 id="preview-title">{t('Preview', 'Vorschau', 'معاينة')}</h2>
                <div className="recipe-preview">{preview}</div>
            </section>
            <aside
                className="entry-facts"
                aria-label={t('Entry details', 'Details zum Eintrag', 'تفاصيل العنصر')}
            >
                <h2>{t('Requirements', 'Voraussetzungen', 'المتطلبات')}</h2>
                <p>{requirements}</p>
                <h2>{t('Quick check', 'Kurztest', 'تحقّق سريع')}</h2>
                <p>{check}</p>
            </aside>
            <section className="entry-section entry-recipe" aria-labelledby="usage-title">
                <h2 id="usage-title">
                    {t(
                        'Use it in your project',
                        'Im eigenen Projekt verwenden',
                        'الاستخدام في مشروعك',
                    )}
                </h2>
                {instructions}
                {children}
            </section>
        </div>
    );
}

function FilterPreview() {
    const { t } = useLocale();
    const [query, setQuery] = useState('C++');
    const base = new URL('https://example.org/library?view=list&page=3#entries');
    const result = writeFilters(base, { query, category: '' });
    return (
        <div className="recipe-demo">
            <label htmlFor="try-filter">{t('Search term', 'Suchbegriff', 'عبارة البحث')}</label>
            <input
                dir="auto"
                id="try-filter"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />
            <dl>
                <dt>{t('Starting URL', 'Ursprüngliche URL', 'الرابط الأصلي')}</dt>
                <dd>
                    <code dir="ltr">
                        {base.pathname}
                        {base.search}
                        {base.hash}
                    </code>
                </dd>
                <dt>{t('Shareable result', 'Link zum Teilen', 'رابط قابل للمشاركة')}</dt>
                <dd>
                    <output htmlFor="try-filter">
                        <code dir="ltr">
                            {result.pathname}
                            {result.search}
                            {result.hash}
                        </code>
                    </output>
                </dd>
            </dl>
        </div>
    );
}

export default function KitRecipe({ slug }: { slug: string }) {
    const { t } = useLocale();
    switch (slug) {
        case 'copy-code':
            return <CopyCodeRecipe />;
        case 'keyboard-shortcut-label':
            return <ShortcutRecipe />;
        case 'search-dialog':
            return <SearchDialogRecipe />;
        case 'empty-state-page':
            return (
                <Recipe
                    requirements={t(
                        'A modern browser with JavaScript enabled. All markup, styles and behaviour are in one HTML file.',
                        'Ein aktueller Browser mit aktiviertem JavaScript. Markup, Gestaltung und Verhalten stehen in einer HTML-Datei.',
                        'متصفح حديث مع تفعيل JavaScript. يحتوي ملف HTML واحد على بنية الصفحة وتنسيقها وسلوك البحث.',
                    )}
                    check={t(
                        'Clear the search using only the keyboard. Three titles should appear and focus should return to the input.',
                        'Leere die Suche per Tastatur. Drei Titel erscheinen und das Suchfeld erhält wieder den Fokus.',
                        'امسح البحث بلوحة المفاتيح وحدها. يجب أن تظهر ثلاثة عناوين ويعود التركيز إلى حقل البحث.',
                    )}
                    preview={
                        <iframe
                            className="recipe-frame"
                            title={t(
                                'Reading list search demo',
                                'Beispiel: Suche in einer englischen Leseliste',
                                'تجربة البحث في قائمة قراءة باللغة الإنجليزية',
                            )}
                            sandbox="allow-scripts"
                            srcDoc={emptyPage}
                        />
                    }
                    instructions={
                        <p>
                            {t(
                                'Save the source as index.html and open it in your browser. Replace the titles with your own. The English demo starts with an unmatched search so you can try clearing it.',
                                'Speichere den Quelltext als index.html und öffne die Datei im Browser. Ersetze die Titel durch deine eigenen. Die englische Demo beginnt mit einer erfolglosen Suche, die du zurücksetzen kannst.',
                                'احفظ الشيفرة في ملف index.html وافتحه في المتصفح. استبدل العناوين بعناوينك. يبدأ المثال الإنجليزي ببحث لا يطابق أي عنوان كي تجرّب مسحه.',
                            )}
                        </p>
                    }
                >
                    <Source label="index.html" code={emptyPage} />
                </Recipe>
            );
        case 'url-filters':
            return (
                <Recipe
                    requirements={t(
                        'TypeScript and the standard URL API. The functions take an absolute URL and return data without changing browser history.',
                        'TypeScript und die Standard-URL-API. Die Funktionen verarbeiten absolute URLs und lassen den Browserverlauf unverändert.',
                        'لغة TypeScript وواجهة URL القياسية. تستقبل الدوال رابطاً مطلقاً وتعيد النتيجة دون تعديل سجل التصفح.',
                    )}
                    check={t(
                        'Enter C++ & React. The result keeps the view and fragment, encodes the search, and resets pagination. Clear the field to remove the query.',
                        'Gib C++ & React ein. Ansicht und Sprungmarke bleiben erhalten, der Suchbegriff wird kodiert und die Seitennummer entfernt. Leere das Feld, um die Suche zu löschen.',
                        'أدخل C++ & React. يحفظ الرابط العرض والجزء الذي يبدأ بعلامة #، ويُرمّز عبارة البحث ويحذف رقم الصفحة. أفرغ الحقل لإزالة البحث.',
                    )}
                    preview={<FilterPreview />}
                    instructions={
                        <p>
                            {t(
                                'Copy the helper into your project. Read the initial filters from the current URL and choose when to add the changed URL to browser history.',
                                'Kopiere die Hilfsfunktionen in dein Projekt. Lies die anfänglichen Filter aus der URL und entscheide, wann eine Änderung im Browserverlauf erscheinen soll.',
                                'انسخ الدوال إلى مشروعك واقرأ المرشحات الأولية من الرابط الحالي. حدّد متى تريد إضافة الرابط المعدّل إلى سجل التصفح.',
                            )}
                        </p>
                    }
                >
                    <CodeExample
                        label={t('Usage', 'Anwendung', 'مثال الاستخدام')}
                        code={`import { readFilters, writeFilters } from './filters';\n\nconst current = new URL(window.location.href);\nconst filters = readFilters(current);\nconst next = writeFilters(current, { ...filters, query: 'C++' });\nwindow.history.pushState(null, '', next);`}
                    />
                    <Source label="filters.ts" code={filterSource} />
                </Recipe>
            );
        case 'catalogue-search':
            return (
                <Recipe
                    requirements={t(
                        'A Laravel 13 application, PHP 8.4 and mbstring. The demo reads its own three public fixtures.',
                        'Eine Laravel-13-Anwendung, PHP 8.4 und mbstring. Das Beispiel durchsucht drei öffentliche Beispieldatensätze.',
                        'تطبيق Laravel 13 وPHP 8.4 وامتداد mbstring. يبحث المثال في ثلاثة سجلات تجريبية علنية.',
                    )}
                    check={t(
                        'Search for utilities and expect one matching entry. A search for unlisted returns an empty data array and a count of zero.',
                        'Suche nach utilities. Ein Treffer sollte erscheinen. Bei unlisted ist das Datenfeld leer und die Anzahl null.',
                        'ابحث عن utilities لتجد نتيجة واحدة. عند البحث عن unlisted ترجع مصفوفة بيانات فارغة وعدد نتائج يساوي صفراً.',
                    )}
                    preview={
                        <form
                            className="recipe-demo"
                            action="/examples/catalogue-search"
                            method="get"
                            target="_blank"
                            rel="noopener"
                        >
                            <label htmlFor="module-query">
                                {t(
                                    'Search the sample index',
                                    'Beispielindex durchsuchen',
                                    'البحث في الفهرس التجريبي',
                                )}
                            </label>
                            <input
                                id="module-query"
                                type="search"
                                name="q"
                                maxLength={80}
                                defaultValue="filters"
                            />
                            <button type="submit">
                                {t(
                                    'Open JSON in a new tab',
                                    'JSON in neuem Tab öffnen',
                                    'عرض JSON في تبويب جديد',
                                )}
                            </button>
                        </form>
                    }
                    instructions={
                        <p>
                            {t(
                                'Put both PHP files in the directory below, register the route, then open the sample URL. Include only public fields in your index.',
                                'Lege beide PHP-Dateien im folgenden Verzeichnis ab, registriere die Route und öffne die Beispiel-URL. Nimm ausschließlich öffentliche Felder in den Index auf.',
                                'ضع ملفَّي PHP في المجلد التالي وسجّل المسار ثم افتح رابط المثال. أضف الحقول المسموح بنشرها فقط إلى الفهرس.',
                            )}
                            <br />
                            <code dir="ltr">kit/modules/catalogue-search/</code>
                            <br />
                            <code dir="ltr">/examples/catalogue-search?q=filters</code>
                        </p>
                    }
                >
                    <CodeExample
                        label={t(
                            'Register in routes/web.php',
                            'In routes/web.php registrieren',
                            'التسجيل في routes/web.php',
                        )}
                        code={`require base_path('kit/modules/catalogue-search/routes.php');`}
                    />
                    <Source label="routes.php" code={moduleRoute} />
                    <Source label="entries.php" code={moduleData} />
                </Recipe>
            );
        case 'accessible-ui-review':
            return (
                <Recipe
                    requirements={t(
                        'Claude Code with project skills, or the Gemini web app with access to custom Gems. Provide the source or interface you want reviewed.',
                        'Claude Code mit Projektskills oder die Gemini-Webanwendung mit eigenen Gems. Stelle den zu prüfenden Quelltext oder die Oberfläche bereit.',
                        'أداة Claude Code مع مهارات المشروع، أو تطبيق Gemini على الويب مع إمكانية إنشاء Gems مخصّصة. أرفق الشيفرة أو الواجهة التي تريد مراجعتها.',
                    )}
                    check={t(
                        'Run the sample task. The response should identify what blocks keyboard access, suggest a native control, and explain how to verify it in a browser.',
                        'Teste die Beispielaufgabe. Die Antwort sollte die Tastaturbarriere benennen, ein natives Bedienelement vorschlagen und einen Browsertest beschreiben.',
                        'جرّب المهمة. ينبغي أن يحدّد الرد عائق استخدام لوحة المفاتيح، ويقترح عنصراً تفاعلياً أصلياً، ويشرح طريقة التحقق منه في المتصفح.',
                    )}
                    preview={
                        <div className="recipe-demo">
                            <h3>{t('Sample task', 'Beispielaufgabe', 'مهمة تجريبية')}</h3>
                            <p>
                                {t(
                                    'Review this clear-search control for keyboard and screen-reader users.',
                                    'Prüfe dieses Bedienelement zum Zurücksetzen der Suche für Personen, die Tastatur oder Screenreader nutzen.',
                                    'راجع عنصر مسح البحث لمن يستخدم لوحة المفاتيح أو قارئ الشاشة.',
                                )}
                            </p>
                            <code dir="ltr">{'<div onclick="clearSearch()">×</div>'}</code>
                            <h3>
                                {t('Expected finding', 'Erwarteter Befund', 'النتيجة المتوقعة')}
                            </h3>
                            <p>
                                {t(
                                    'The clickable div lacks button semantics and a meaningful name. Use a button named “Clear search”. Check that Tab reaches it and both Space and Enter activate it.',
                                    'Dem anklickbaren div fehlen die Semantik einer Schaltfläche und ein verständlicher Name. Verwende einen Button mit dem Namen „Suche löschen“. Prüfe den Fokus mit Tab und die Aktivierung mit Leertaste und Eingabe.',
                                    'لا يوفّر عنصر div القابل للنقر خصائص الزر أو اسماً واضحاً. استخدم زراً باسم «مسح البحث»، ثم تحقّق من الوصول إليه بمفتاح Tab وتشغيله بمفتاح المسافة أو Enter.',
                                )}
                            </p>
                        </div>
                    }
                    instructions={
                        <>
                            <p>
                                {t(
                                    'Save the skill at the path below. Run /accessible-ui-review with your component path or snippet in Claude Code.',
                                    'Speichere den Skill unter dem folgenden Pfad. Rufe in Claude Code /accessible-ui-review mit dem Komponentenpfad oder einem Codeausschnitt auf.',
                                    'احفظ المهارة في المسار التالي. شغّل ‎/accessible-ui-review‎ في Claude Code مع مسار المكوّن أو مقتطف من شيفرته.',
                                )}
                                <br />
                                <code dir="ltr">.claude/skills/accessible-ui-review/SKILL.md</code>
                                <br />
                                <a href="https://code.claude.com/docs/en/skills">
                                    {t(
                                        'Claude Code skills',
                                        'Claude-Code-Skills',
                                        'مهارات Claude Code',
                                    )}
                                </a>
                            </p>
                            <p>
                                {t(
                                    'Create a Gem in Gemini, paste the instructions, preview the sample task and save the Gem.',
                                    'Erstelle ein Gem in Gemini, füge die Anleitung ein, teste die Beispielaufgabe in der Vorschau und speichere das Gem.',
                                    'أنشئ Gem في Gemini وألصق التعليمات. جرّب المهمة في المعاينة ثم احفظ الأداة.',
                                )}{' '}
                                <a href="https://support.google.com/gemini/answer/15235603">
                                    {t('Gem setup guide', 'Anleitung für Gems', 'دليل إعداد Gem')}
                                </a>
                            </p>
                        </>
                    }
                >
                    <Source label="SKILL.md" code={skill} />
                    <Source
                        label={t('Gem instructions', 'Gem-Anleitung', 'تعليمات Gem')}
                        code={gem}
                    />
                </Recipe>
            );
        default:
            throw new Error(`Unknown kit recipe: ${slug}`);
    }
}
