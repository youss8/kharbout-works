import { compilePrompt, newDraft } from './model.ts';
import type { ModelProfileId } from './profiles.ts';
import { l, type Locale, type presets } from './workflows.ts';

const sharedChecks = [
    l('Preserves supplied facts', 'حافظ على الحقائق المقدَّمة'),
    l('Flags missing information where relevant', 'وضّح المعلومات الناقصة'),
    l('Delivers the requested format and sections', 'قدّم جميع الأجزاء المطلوبة'),
    l('Gives a usable next action where relevant', 'اذكر خطوة عملية تالية حيثما أمكن'),
];

export function benchmarkFixture(
    preset: (typeof presets)[number],
    locale: Locale,
    profile: ModelProfileId,
) {
    const draft = newDraft(preset.id, locale);
    draft.preferences.profile = profile;
    draft.values = Object.fromEntries(
        preset.fields.map((field) => [field.key, field.example[locale]]),
    );
    return {
        workflow: preset.id,
        prompts: [
            preset.title[locale] +
                '. ' +
                preset.fields
                    .map((field) => field.label[locale] + ': ' + field.example[locale])
                    .join(' '),
            compilePrompt(draft, 'detailed'),
        ],
        checks: [...sharedChecks, ...preset.checks].map((check) => check[locale]),
    };
}
