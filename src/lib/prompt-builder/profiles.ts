import sources from './profile-sources.json' with { type: 'json' };
import { l } from './workflows.ts';

export type ModelProfileId = 'universal' | keyof typeof sources;
type Translation = ReturnType<typeof l>;
type Extra = 'sources' | 'criteria' | 'example';
type Profile = {
    title: string;
    layout: 'standard' | 'output-first' | 'query-last' | 'xml' | 'copilot';
    focus: Extra;
    coding?: boolean;
    rule?: Translation;
    guidance: Translation;
    usage: Translation;
};

export const profiles = {
    universal: {
        title: 'Any assistant', layout: 'standard', focus: 'criteria',
        guidance: l('Use a clear task, labeled context, and an explicit deliverable.', 'اكتب مهمة واضحة وسياقًا معنْونًا وحدِّد المطلوب.'),
        usage: l('Paste as a single message in your assistant.', 'ألصق الموجّه كرسالة واحدة في المساعد.'),
    },
    openai: {
        title: 'ChatGPT / GPT', layout: 'standard', focus: 'example',
        rule: l('Deliver the requested parts in order and apply each constraint to the part it describes.', 'قدِّم الأجزاء المطلوبة بالترتيب وطبّق كل قيد على الجزء الذي يخصّه.'),
        guidance: l('Use Markdown sections for the task, source material, and response requirements.', 'استخدم عناوين Markdown للمهمة والمصادر ومتطلبات الرد.'),
        usage: l('Paste the full prompt into ChatGPT. In the Responses API, put reusable policy in a developer message and per-task input in the user message. Use Structured Outputs when a schema must be enforced.', 'ألصق الموجّه كاملًا في ChatGPT. في واجهة Responses، ضع السياسة القابلة لإعادة الاستخدام في رسالة المطوّر ومدخلات المهمة في رسالة المستخدم. استخدم Structured Outputs لفرض مخطط.'),
    },
    'openai-reasoning': {
        title: 'OpenAI reasoning models', layout: 'output-first', focus: 'criteria',
        rule: l('Give the result with the key evidence or assumptions needed to assess it.', 'قدِّم النتيجة مع الأدلة أو الافتراضات الأساسية اللازمة لتقييمها.'),
        guidance: l('State the goal, constraints, and success criteria directly. Add an example only when it resolves ambiguity.', 'اذكر الهدف والقيود ومعايير النجاح مباشرةً. أضف مثالًا إذا كان يزيل الغموض.'),
        usage: l('Choose a reasoning-capable model in your assistant or API. Set reasoning effort in the API when available. Ask for the deliverable and supporting evidence.', 'اختر نموذجًا يدعم الاستدلال في المساعد أو الواجهة البرمجية. اضبط جهد الاستدلال من الواجهة إن توفر. اطلب المطلوب والأدلة الداعمة.'),
    },
    claude: {
        title: 'Claude', layout: 'xml', focus: 'example',
        guidance: l('Separate the task, context, requirements, and examples with descriptive XML tags.', 'افصل المهمة والسياق والمتطلبات والأمثلة بعلامات XML وصفية.'),
        usage: l('Paste into Claude as one message. With the Messages API, place reusable role guidance in the top-level system field. Use Structured Outputs for an enforced schema on a supported model.', 'ألصق الموجّه كرسالة واحدة في Claude. في واجهة Messages، ضع توجيهات الدور المشتركة في حقل system العلوي. استخدم Structured Outputs لفرض مخطط على نموذج يدعمه.'),
    },
    gemini: {
        title: 'Gemini', layout: 'query-last', focus: 'sources',
        guidance: l('Put response constraints first and place the specific request after the reference material.', 'ضع قيود الرد أولًا واطرح الطلب المحدد بعد المواد المرجعية.'),
        usage: l('Attach any documents mentioned in the prompt. In the Gemini API, put standing constraints in the system instruction and configure structured output on models that support it.', 'أرفق المستندات المذكورة في الموجّه. في واجهة Gemini، ضع القيود الدائمة في تعليمات النظام واضبط المخرجات المنظمة للنماذج التي تدعمها.'),
    },
    deepseek: {
        title: 'DeepSeek', layout: 'output-first', focus: 'criteria',
        rule: l('Make the final answer self-contained so it can be used on its own.', 'اجعل الإجابة النهائية مكتفية بذاتها لتكون قابلة للاستخدام مباشرةً.'),
        guidance: l('Use a direct task and a concrete answer format. Provide the facts the model should work from.', 'اكتب مهمة مباشرة وحدِّد شكل الإجابة وقدّم الحقائق التي ينبغي الاعتماد عليها.'),
        usage: l('Set thinking mode and effort through the API for supported models. With Chat Completions JSON mode, include a JSON example and also set the response format in the request.', 'اضبط وضع التفكير وجهده من الواجهة البرمجية للنماذج المدعومة. عند استخدام وضع JSON في Chat Completions، أضف مثال JSON واضبط تنسيق الرد في الطلب أيضًا.'),
    },
    grok: {
        title: 'Grok', layout: 'output-first', focus: 'criteria',
        rule: l('For time-sensitive claims, name the evidence you checked or mark the claim as unverified.', 'للادعاءات المرتبطة بوقت محدد، اذكر الأدلة التي راجعتها أو وضّح أن الادعاء غير مؤكَّد.'),
        guidance: l('Specify the task, constraints, and requested answer format up front.', 'حدِّد المهمة والقيود وشكل الإجابة المطلوب في البداية.'),
        usage: l('For current facts, enable the relevant search tools in the interface or API and ask the model to identify the sources it actually used.', 'للمعلومات الحديثة، فعِّل أدوات البحث ذات الصلة في الواجهة واطلب ذكر المصادر التي استُخدمت فعليًا.'),
    },
    mistral: {
        title: 'Mistral / Le Chat', layout: 'standard', focus: 'example',
        rule: l('Map each requested item to a clearly identifiable part of the answer.', 'اربط كل عنصر مطلوب بجزء واضح يمكن تحديده في الرد.'),
        guidance: l('Use a clear purpose, labeled sections, and a representative example when the format matters.', 'حدِّد الغرض ونظّم الموجّه بعناوين وأدرج مثالًا ممثلًا عندما يكون التنسيق مهمًا.'),
        usage: l('Paste into Le Chat. For the API, keep reusable rules in the system message and set a structured response format separately when needed.', 'ألصق الموجّه في Le Chat. في الواجهة البرمجية، ضع القواعد المشتركة في رسالة النظام واضبط تنسيق الرد المنظّم عند الحاجة.'),
    },
    llama: {
        title: 'Meta Llama 4 Instruct', layout: 'standard', focus: 'criteria',
        rule: l('Match the requested voice and organize the answer around the user’s purpose.', 'استخدم الأسلوب المطلوب ونظّم الرد بما يخدم غرض المستخدم.'),
        guidance: l('Set the desired tone and format explicitly, and keep the task grounded in the supplied input.', 'حدِّد النبرة والتنسيق بوضوح واربط المهمة بالمدخلات المقدّمة.'),
        usage: l('For self-hosted inference, pass the prompt as user content and let the serving runtime apply the Llama 4 chat template for your checkpoint.', 'عند الاستضافة الذاتية، مرِّر الموجّه كمحتوى رسالة المستخدم ودع بيئة التشغيل تطبّق قالب محادثة Llama 4 الموافق لإصدار النموذج.'),
    },
    qwen: {
        title: 'Qwen3', layout: 'output-first', focus: 'criteria',
        guidance: l('Specify the answer shape and provide any input the model should use.', 'حدِّد شكل الإجابة وقدّم المدخلات التي يحتاجها النموذج.'),
        usage: l('Use the chat template for your Qwen checkpoint. Select thinking mode in the runtime when that checkpoint supports switching.', 'استخدم قالب المحادثة الموافق لإصدار Qwen. اختر وضع التفكير من بيئة التشغيل إذا كان الإصدار يدعم التبديل.'),
    },
    copilot: {
        title: 'Microsoft 365 Copilot', layout: 'copilot', focus: 'sources',
        rule: l('Identify the sources you used and flag any requested source that was unavailable.', 'اذكر المصادر التي استخدمتها ووضّح أي مصدر مطلوب تعذّر الوصول إليه.'),
        guidance: l('Describe the goal, context, sources, and expectations. Name the specific work items to use.', 'صِف الهدف والسياق والمصادر والنتيجة المتوقعة. حدِّد عناصر العمل المطلوب استخدامها.'),
        usage: l('Attach or reference files, emails, or meetings in Copilot. Available sources depend on your account and its access.', 'أرفق الملفات أو أشِر إلى الرسائل والاجتماعات في Copilot. تعتمد المصادر المتاحة على صلاحيات حسابك.'),
    },
    'github-copilot': {
        title: 'GitHub Copilot', layout: 'standard', focus: 'criteria', coding: true,
        rule: l('Use the named files and symbols to scope the task. Stop when the requested behavior and acceptance criteria are addressed.', 'استخدم الملفات والرموز المذكورة لتحديد نطاق المهمة. توقّف عند تحقيق السلوك المطلوب ومعايير القبول.'),
        guidance: l('Give the objective first, then the relevant files, symbols, and acceptance criteria.', 'اذكر الهدف أولًا، ثم الملفات والرموز ذات الصلة ومعايير القبول.'),
        usage: l('In the IDE, open or attach relevant files. For a cloud coding task, choose the intended repository and base branch.', 'في بيئة التطوير، افتح الملفات ذات الصلة أو أرفقها. لمهمة برمجية سحابية، اختر المستودع والفرع الأساسي المقصودين.'),
    },
    codex: {
        title: 'OpenAI Codex', layout: 'standard', focus: 'criteria', coding: true,
        rule: l('Follow the repository’s instructions for the affected scope. Base your work on the requested outcome and report the evidence that it is complete.', 'اتّبع تعليمات المستودع الخاصة بنطاق المهمة. اعمل وفق النتيجة المطلوبة واذكر ما يثبت اكتمالها.'),
        guidance: l('Describe the user-visible outcome, project boundaries, and evidence that would show the work is complete.', 'صِف النتيجة التي سيلاحظها المستخدم وحدود العمل والأدلة التي تثبت اكتماله.'),
        usage: l('Run in the intended workspace. Keep durable repository guidance in AGENTS.md and put this task’s specific details in the prompt.', 'شغّل Codex في مساحة العمل المقصودة. ضع تعليمات المستودع الدائمة في AGENTS.md وأضف تفاصيل المهمة إلى الموجّه.'),
    },
    'claude-code': {
        title: 'Claude Code', layout: 'standard', focus: 'criteria', coding: true,
        rule: l('Use relevant project context and check the outcome against the stated criteria. Mention any check you could not run.', 'استخدم سياق المشروع ذا الصلة وتحقّق من النتيجة وفق المعايير المحددة. اذكر أي فحص تعذّر تشغيله.'),
        guidance: l('Describe what the tool cannot see by itself, reference the relevant files, and give it a check to run.', 'صِف ما لا تستطيع الأداة رؤيته بنفسها وأشِر إلى الملفات ذات الصلة وقدّم فحصًا لتشغيله.'),
        usage: l('Open the intended repository in Claude Code. Put durable project instructions in CLAUDE.md.', 'افتح المستودع المقصود في Claude Code. ضع تعليمات المشروع الدائمة في CLAUDE.md.'),
    },
    perplexity: {
        title: 'Perplexity', layout: 'standard', focus: 'sources',
        rule: l('For claims that rely on research, cite supporting sources at the point of use and flag missing or conflicting evidence.', 'عند تقديم ادعاءات مبنية على البحث، استشهد بالمصادر الداعمة بجانب الادعاء ووضّح الأدلة الناقصة أو المتعارضة.'),
        guidance: l('Name the subject and scope precisely so the query can find relevant sources.', 'حدِّد الموضوع والنطاق بدقة كي يصل البحث إلى المصادر ذات الصلة.'),
        usage: l('For hard date, region, or domain limits in the Agent API, configure search filters on the request.', 'لفرض قيود التاريخ أو المنطقة أو النطاق في واجهة Agent، اضبط مرشحات البحث في الطلب.'),
    },
} satisfies Record<ModelProfileId, Profile>;

export const modelProfiles = Object.entries(profiles).map(([id, details]) => ({
    id: id as ModelProfileId,
    title: details.title,
    source: Object.hasOwn(sources, id) ? sources[id as keyof typeof sources] : null,
}));

export function isModelProfile(value: unknown): value is ModelProfileId {
    return typeof value === 'string' && Object.hasOwn(profiles, value);
}

export function modelProfile(id: ModelProfileId): Profile {
    return profiles[id];
}
