import '../../../kit/components/keyboard-shortcut-label/shortcut.css';
import markup from '../../../kit/components/keyboard-shortcut-label/index.html?raw';
import styles from '../../../kit/components/keyboard-shortcut-label/shortcut.css?raw';
import { useLocale } from '../i18n';
import CodeExample from './CodeExample';

export default function ShortcutRecipe() {
    const { t } = useLocale();
    return (
        <div className="entry-content">
            <section className="entry-section" aria-labelledby="preview-title">
                <h2 id="preview-title">{t('Preview', 'Vorschau', 'معاينة')}</h2>
                <figure
                    className="shortcut-preview"
                    aria-label={t(
                        'Preview of a command with a keyboard shortcut',
                        'Vorschau eines Befehls mit Tastenkürzel',
                        'معاينة أمر مع اختصار لوحة المفاتيح',
                    )}
                    ref={(figure) => {
                        if (!figure) return;
                        const example = new DOMParser().parseFromString(markup, 'text/html');
                        const label = example.querySelector('.command-label');
                        const modifier = example.querySelector('kbd');
                        if (label?.textContent)
                            label.textContent = t(label.textContent, 'Suche öffnen', 'افتح البحث');
                        if (modifier?.textContent)
                            modifier.textContent = t(modifier.textContent, 'Strg', 'Ctrl');
                        figure.replaceChildren(...example.body.children);
                    }}
                />
            </section>
            <aside
                className="entry-facts"
                aria-label={t('Entry details', 'Eintragsdetails', 'تفاصيل العنصر')}
            >
                <h2>{t('Requirements', 'Voraussetzungen', 'المتطلبات')}</h2>
                <p>
                    {t(
                        'HTML and CSS. Works in an existing page without a JavaScript dependency.',
                        'HTML und CSS reichen aus. Das Beispiel lässt sich in eine vorhandene Seite einbauen.',
                        'يمكن استخدام المثال في صفحة موجودة باستخدام HTML وCSS فقط.',
                    )}
                </p>
                <h2>{t('Quick check', 'Kurztest', 'اختبار سريع')}</h2>
                <p>
                    {t(
                        'At a narrow width, the keys stay together as the label wraps. Verify that the displayed combination runs the intended command in your project.',
                        'Verkleinere das Fenster. Die Tasten sollen zusammenbleiben, wenn der Text umbricht. Prüfe das Kürzel in deiner Anwendung.',
                        'صغّر عرض النافذة. تأكّد من بقاء المفاتيح معًا عند التفاف النص، ثم جرّب الاختصار في تطبيقك.',
                    )}
                </p>
            </aside>
            <section className="entry-section entry-recipe" aria-labelledby="use-title">
                <h2 id="use-title">
                    {t(
                        'Use it in your project',
                        'Im eigenen Projekt nutzen',
                        'الاستخدام في مشروعك',
                    )}
                </h2>
                <p>
                    {t(
                        'Place the label beside the command it describes. Change the text and keys to match a shortcut your application already handles.',
                        'Setze die Beschriftung neben den Befehl. Passe Text und Tasten an das Kürzel deiner Anwendung an.',
                        'ضع التسمية بجانب الأمر، ثم عدّل النص والمفاتيح لتطابق اختصارًا يدعمه تطبيقك.',
                    )}
                </p>
                <CodeExample label="HTML" code={markup} />
                <CodeExample label="CSS" code={styles} />
            </section>
        </div>
    );
}
