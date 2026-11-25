import { compilePrompt, newDraft } from '../src/lib/prompt-builder/model.ts';
import { presets } from '../src/lib/prompt-builder/workflows.ts';
import { isModelProfile } from '../src/lib/prompt-builder/profiles.ts';
import { model, providerRequest, readOutput } from '../supabase/functions/prompt-ai/contract.ts';

const run = process.argv.includes('--run');
const locale = process.argv.includes('--ar') ? 'ar' : 'en';
const apiKey = process.env.OPENAI_API_KEY;
const profileArgument = process.argv.find(argument => argument.startsWith('--profile='));
const profile = profileArgument ? profileArgument.slice('--profile='.length) : 'universal';
if (!isModelProfile(profile)) throw new Error('Unknown model profile: ' + profile);
if (run && !['universal', 'openai'].includes(profile)) {
    throw new Error('Use fixture mode for this profile and evaluate it in the selected assistant. Live runs here use the default GPT settings.');
}
if (run && !apiKey) throw new Error('Set OPENAI_API_KEY to a staging project key before using --run.');

const sharedChecks = locale === 'ar'
    ? ['حافظ على الحقائق المقدَّمة', 'وضّح المعلومات الناقصة', 'قدّم جميع الأجزاء المطلوبة', 'اذكر خطوة عملية تالية حيثما أمكن']
    : ['Preserves supplied facts', 'Flags missing information where relevant', 'Delivers the requested format and sections', 'Gives a usable next action where relevant'];

async function ask(request) {
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
        body: JSON.stringify(providerRequest(request)),
        signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error('Provider returned ' + response.status);
    const result = await response.json();
    if (result.status !== 'completed') throw new Error('Provider did not complete ' + request.action);
    const output = result.output.flatMap(item => item.content ?? [])
        .filter(item => item.type === 'output_text').map(item => item.text).join('');
    const parsed = readOutput(request, output);
    if (!parsed) throw new Error('Provider returned an invalid result for ' + request.action);
    return parsed;
}

const results = [];
for (const preset of presets) {
    const draft = newDraft(preset.id, locale);
    draft.preferences.profile = profile;
    draft.values = Object.fromEntries(preset.fields.map(field => [field.key, field.example[locale]]));
    const prompts = [
        preset.title[locale] + '. ' + preset.fields.map(field => field.label[locale] + ': ' + field.example[locale]).join(' '),
        compilePrompt(draft, 'detailed'),
    ];
    const checks = [...sharedChecks, ...preset.checks.map(check => check[locale])];
    const result = { workflow: preset.id, prompts, checks };
    if (run) {
        try {
            const runs = [];
            for (const prompt of prompts) runs.push({ prompt, result: (await ask({ action: 'run', prompt })).result });
            const comparison = await ask({ action: 'evaluate', runs, checks });
            result.answers = runs.map(item => item.result);
            result.comparison = comparison.results;
            result.score = comparison.results.reduce((score, item) => ({
                plain: score.plain + Number(item.a), builder: score.builder + Number(item.b),
            }), { plain: 0, builder: 0 });
        } catch (error) {
            result.error = error.message;
            process.exitCode = 1;
        }
    }
    results.push(result);
}
console.log(JSON.stringify({ profile, ...(run ? { model } : {}), locale, mode: run ? 'run' : 'fixtures', generatedAt: new Date().toISOString(), results }, null, 2));
