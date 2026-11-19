import CopyCodeButton from './CopyCodeButton';
import { useLocale } from '../i18n';

type CodeExampleProps = {
    label: string;
    code: string;
};

export default function CodeExample({ label, code }: CodeExampleProps) {
    const { t } = useLocale();
    return (
        <div className="code-example">
            <div className="code-example-heading">
                <h3>{label}</h3>
                <CopyCodeButton
                    key={code}
                    label={label}
                    code={code}
                    messages={{
                        button: t(`Copy ${label}`, `${label} kopieren`, `نسخ ${label}`),
                        pending: t('Copying…', 'Wird kopiert…', 'جارٍ النسخ…'),
                        success: t(`Copied ${label}.`, `${label} kopiert.`, `تم نسخ ${label}.`),
                        failure: t(
                            `Couldn’t copy ${label}. Select the code and use your device’s Copy command.`,
                            `${label} konnte nicht kopiert werden. Markiere den Code und kopiere ihn manuell.`,
                            `تعذّر نسخ ${label}. حدّد الشيفرة وانسخها يدويًا.`,
                        ),
                    }}
                />
            </div>
            <pre
                dir="ltr"
                tabIndex={0}
                aria-label={t(`${label} example`, `Beispiel: ${label}`, `مثال ${label}`)}
            >
                <code>{code}</code>
            </pre>
        </div>
    );
}
