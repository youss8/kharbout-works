import Example from '../../../kit/components/search-dialog/Example';
import exampleSource from '../../../kit/components/search-dialog/Example.tsx?raw';
import dialogSource from '../../../kit/components/search-dialog/SearchDialog.tsx?raw';
import stylesheet from '../../../kit/components/search-dialog/search-dialog.css?raw';
import { useLocale } from '../i18n';
import CodeExample from './CodeExample';
import '../../css/kit-recipe.css';

const translatedBooks = {
    de: [
        { id: 'river', title: 'Der Flussalmanach', description: 'Ein Führer zu Flussübergängen.' },
        { id: 'lantern', title: 'Der Laternenatlas', description: 'Karten des alten Hafens.' },
        {
            id: 'shore',
            title: 'Das stille Ufer',
            description: 'Notizen von einer Küstenwanderung.',
        },
    ],
    ar: [
        { id: 'river', title: 'تقويم النهر', description: 'دليل إلى معابر النهر.' },
        { id: 'lantern', title: 'أطلس الفوانيس', description: 'خرائط المرفأ القديم.' },
        { id: 'shore', title: 'الشاطئ الهادئ', description: 'ملاحظات من رحلة على الساحل.' },
    ],
};

export default function SearchDialogRecipe() {
    const { locale, t } = useLocale();

    return (
        <div className="entry-content">
            <section className="entry-section" aria-labelledby="dialog-preview-title">
                <h2 id="dialog-preview-title">{t('Preview', 'Vorschau', 'معاينة')}</h2>
                <p>
                    {t(
                        'Pick a book from this reading list. The selected title appears under the button.',
                        'Wähle ein Buch aus der Leseliste. Der gewählte Titel erscheint unter der Schaltfläche.',
                        'اختر كتاباً من قائمة القراءة ليظهر عنوانه أسفل الزر.',
                    )}
                </p>
                <div className="recipe-preview">
                    <Example
                        books={locale === 'en' ? undefined : translatedBooks[locale]}
                        buttonLabel={t(
                            'Search reading list',
                            'Leseliste durchsuchen',
                            'ابحث في قائمة القراءة',
                        )}
                        selectionLabel={t('Selected book', 'Gewähltes Buch', 'الكتاب المختار')}
                        labels={{
                            title: t('Reading list', 'Leseliste', 'قائمة القراءة'),
                            input: t('Search books', 'Bücher suchen', 'ابحث عن كتاب'),
                            close: t('Close', 'Schließen', 'إغلاق'),
                            empty: t(
                                'No books match. Try another title.',
                                'Kein Buch gefunden. Versuche einen anderen Titel.',
                                'لم نعثر على كتاب مطابق. جرّب عنواناً آخر.',
                            ),
                        }}
                    />
                </div>
            </section>
            <aside
                className="entry-facts"
                aria-label={t('Entry details', 'Eintragsdetails', 'تفاصيل العنصر')}
            >
                <h2>{t('Requirements', 'Voraussetzungen', 'المتطلبات')}</h2>
                <p>
                    {t(
                        'React, TypeScript, a bundler that loads CSS and a browser with native modal dialogs. The standalone example uses Node.js 24, React 19 and Vite 8.',
                        'React, TypeScript, ein Bundler für CSS und ein Browser mit nativen modalen Dialogen. Das eigenständige Beispiel verwendet Node.js 24, React 19 und Vite 8.',
                        'يتطلب المكوّن React وTypeScript وأداة تجميع تدعم CSS ومتصفحاً يدعم مربعات الحوار المشروطة. يستخدم المثال المستقل Node.js 24 وReact 19 وVite 8.',
                    )}
                </p>
                <h2>{t('Quick check', 'Kurztest', 'اختبار سريع')}</h2>
                <p>
                    {t(
                        'Tab to the reading list button and press Enter. Start typing immediately, use ↓ to choose a book and press Enter. Open it again and press Escape. Focus should return to the button.',
                        'Gehe mit Tab zur Leseliste und drücke Enter. Tippe einen Suchbegriff ein, wähle mit ↓ ein Buch und bestätige mit Enter. Öffne die Liste erneut und drücke Escape. Der Fokus sollte wieder auf der Schaltfläche liegen.',
                        'انتقل بمفتاح Tab إلى زر قائمة القراءة ثم اضغط Enter. اكتب كلمة بحث واختر كتاباً بالسهم للأسفل ثم اضغط Enter. افتح القائمة مجدداً واضغط Escape. ينبغي أن يعود التركيز إلى الزر.',
                    )}
                </p>
            </aside>
            <section className="entry-section entry-recipe" aria-labelledby="dialog-use-title">
                <h2 id="dialog-use-title">
                    {t(
                        'Use it in your project',
                        'Im eigenen Projekt nutzen',
                        'الاستخدام في مشروعك',
                    )}
                </h2>
                <p>
                    {t(
                        'Copy the component and stylesheet into the same folder. Supply a search function that returns results with an ID, title and description. Your host controls when the dialog opens and what happens after a result is selected.',
                        'Lege Komponente und Stylesheet im selben Ordner ab. Übergib eine Suchfunktion, die Treffer mit ID, Titel und Beschreibung liefert. Deine Anwendung öffnet den Dialog und legt fest, was nach der Auswahl geschieht.',
                        'ضع المكوّن وملف التنسيق في المجلد نفسه. مرّر دالة بحث تعيد لكل نتيجة معرّفاً وعنواناً ووصفاً. يتحكم تطبيقك في فتح مربع الحوار وفي الإجراء التالي لاختيار النتيجة.',
                    )}
                </p>
                <p>
                    {t(
                        'Register Ctrl+K or Cmd+K once in your application shell. Here it opens the catalogue search. In the downloaded example the same shortcut opens the reading list.',
                        'Registriere Strg+K oder Cmd+K einmal in deiner Anwendung. Hier öffnet das Kürzel die Katalogsuche. Im heruntergeladenen Beispiel öffnet es die Leseliste.',
                        'سجّل Ctrl+K أو Cmd+K مرة واحدة في تطبيقك. يفتح الاختصار هنا بحث الفهرس، وفي المثال القابل للتنزيل يفتح قائمة القراءة.',
                    )}
                </p>
                <p>
                    {t(
                        'To run the example on its own, extract the ZIP, then run these commands in the extracted folder and open the local URL.',
                        'Entpacke die ZIP-Datei, führe diese Befehle im entpackten Ordner aus und öffne die angezeigte lokale URL.',
                        'لتشغيل المثال مستقلاً، فك ضغط الملف ونفّذ هذين الأمرين في المجلد المستخرج ثم افتح الرابط المحلي.',
                    )}
                </p>
                <CodeExample
                    label={t('Run the example', 'Beispiel starten', 'تشغيل المثال')}
                    code={'npm ci\nnpm run dev'}
                />
                {[
                    ['Example.tsx', exampleSource],
                    ['SearchDialog.tsx', dialogSource],
                    ['search-dialog.css', stylesheet],
                ].map(([file, source]) => (
                    <details className="recipe-source" key={file}>
                        <summary>
                            <bdi dir="ltr">{file}</bdi>
                        </summary>
                        <CodeExample label={file} code={source} />
                    </details>
                ))}
            </section>
        </div>
    );
}
