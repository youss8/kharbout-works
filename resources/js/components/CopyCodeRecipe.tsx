import { useLocale } from '../i18n';
import CodeExample from './CodeExample';
import buttonSource from './CopyCodeButton.tsx?raw';
import stylesheet from '../../css/copy-code.css?raw';

const preview = `const entry = {
    title: 'Copy code',
    collection: 'Components',
};`;

const usage = `import CopyCodeButton from './CopyCodeButton';

const source = "const collection = 'Components';";

export default function Example() {
    return (
        <section>
            <CopyCodeButton label="JavaScript" code={source} />
            <pre><code>{source}</code></pre>
        </section>
    );
}`;

export default function CopyCodeRecipe() {
    const { t } = useLocale();
    return (
        <div className="entry-content">
            <section className="entry-section" aria-labelledby="copy-preview-title">
                <h2 id="copy-preview-title">{t('Preview', 'Vorschau', 'معاينة')}</h2>
                <CodeExample label="JavaScript" code={preview} />
            </section>
            <aside
                className="entry-facts"
                aria-label={t('Entry details', 'Eintragsdetails', 'تفاصيل العنصر')}
            >
                <h2>{t('Requirements', 'Voraussetzungen', 'المتطلبات')}</h2>
                <p>
                    {t(
                        'React and TypeScript. Browser clipboard access requires HTTPS or localhost and a user gesture.',
                        'React und TypeScript. Der Zugriff auf die Zwischenablage benötigt HTTPS oder localhost und eine Benutzeraktion.',
                        'يتطلب المثال React وTypeScript. يتطلب الوصول إلى الحافظة HTTPS أو localhost وتفاعلًا من المستخدم.',
                    )}
                </p>
                <h2>{t('Quick check', 'Kurztest', 'اختبار سريع')}</h2>
                <p>
                    {t(
                        'Tab to Copy JavaScript and press Enter. Paste into an editor and compare the indentation with the preview. If copying is blocked, the snippet stays selectable.',
                        'Gehe mit Tab zu „JavaScript kopieren“ und drücke Enter. Füge den Text in einen Editor ein und prüfe die Einrückung. Bei gesperrter Zwischenablage kannst du den Code markieren.',
                        'انتقل بمفتاح Tab إلى «نسخ JavaScript» واضغط Enter. الصق النص في محرر وقارن المسافات البادئة بالمعاينة. إذا تعذّر النسخ يمكنك تحديد الشيفرة يدويًا.',
                    )}
                </p>
            </aside>
            <section className="entry-section entry-recipe" aria-labelledby="copy-use-title">
                <h2 id="copy-use-title">
                    {t(
                        'Use it in your project',
                        'Im eigenen Projekt nutzen',
                        'الاستخدام في مشروعك',
                    )}
                </h2>
                <p>
                    {t(
                        'Save the component and stylesheet below, then adjust the CSS import to match your folders. Pass the same source string to the button and the visible code block. The label names the snippet in the button and its status message.',
                        'Speichere die Komponente und ihr Stylesheet. Passe den CSS-Import an und übergib denselben Quelltext an den Button und den Codeblock. Die Beschriftung benennt das Beispiel im Button und in der Rückmeldung.',
                        'احفظ المكوّن وملف التنسيق وعدّل مسار CSS. مرّر النص نفسه إلى الزر وإلى كتلة الشيفرة. تحدد التسمية اسم المقتطف في الزر ورسالة الحالة.',
                    )}
                </p>
                <CodeExample label={t('Usage', 'Verwendung', 'الاستخدام')} code={usage} />
                <details className="copy-source">
                    <summary>
                        {t(
                            'View component source',
                            'Komponentenquelltext anzeigen',
                            'عرض شيفرة المكوّن',
                        )}
                    </summary>
                    <CodeExample label="CopyCodeButton.tsx" code={buttonSource} />
                </details>
                <details className="copy-source">
                    <summary>
                        {t('View stylesheet', 'Stylesheet anzeigen', 'عرض ملف التنسيق')}
                    </summary>
                    <CodeExample label="copy-code.css" code={stylesheet} />
                </details>
            </section>
        </div>
    );
}
