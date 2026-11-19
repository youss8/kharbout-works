import { useLocale } from '../i18n';
import CodeExample from './CodeExample';
import { ShortcutPreview } from './CatalogueShell';

const markup = `<span class="command">
  <span>Open search</span>
  <span class="keys"><kbd>Ctrl</kbd> + <kbd>K</kbd></span>
</span>`;

const styles = `.command {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.keys { white-space: nowrap; }

kbd {
  display: inline-block;
  padding: .2em .45em;
  border: 1px solid currentColor;
  border-block-end-width: 2px;
  border-radius: .25em;
  font: inherit;
}`;

export default function ShortcutRecipe() {
    const { t } = useLocale();
    return (
        <div className="entry-content">
            <section className="entry-section" aria-labelledby="preview-title">
                <h2 id="preview-title">{t('Preview', 'Vorschau', 'معاينة')}</h2>
                <ShortcutPreview />
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
