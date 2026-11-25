export const builderPath = '/ai-kit/prompt-builder/';
export type Locale = 'en' | 'ar';
type Translation = Readonly<Record<Locale, string>>;
export const l = (en: string, ar: string): Translation => ({ en, ar });

interface Field {
    key: string;
    label: Translation;
    hint: Translation;
    example: Translation;
    required: boolean;
}

interface Workflow {
    id: string;
    version: 1;
    title: Translation;
    description: Translation;
    group: 'everyday' | 'engineering' | 'internal';
    instruction: Translation;
    fields: Field[];
    checks: Translation[];
}

function field(key: string, label: Translation, hint: Translation, example: Translation, required = true): Field {
    return { key, label, hint, example, required };
}

function workflow(id: string, group: Workflow['group'], title: Translation, description: Translation,
    instruction: Translation, fields: Field[], checks: Translation[]): Workflow {
    return { id, version: 1, title, group, description, instruction, fields, checks };
}

const recipient = field('RECIPIENT', l('Recipient', 'المستلم'), l('Who will read this?', 'من سيقرأ النص؟'), l('The volunteer team', 'فريق المتطوعين'));
const notes = field('NOTES', l('Source notes', 'الملاحظات الأصلية'), l('Paste the notes the answer should use.', 'ألصق الملاحظات التي يجب أن يستند إليها الرد.'), l('The team agreed to move the workshop to Thursday. Lina will confirm the room. No deadline was set.', 'اتفق الفريق على نقل الورشة إلى الخميس. ستؤكد لينا حجز القاعة. لم يُحدَّد موعد نهائي.'));
const context = field('CONTEXT', l('Confirmed context', 'السياق المؤكَّد'), l('Include facts the next step can rely on.', 'أضف الحقائق التي يمكن أن تعتمد عليها الخطوة التالية.'), l('The workshop is on Thursday. Room confirmation is pending.', 'ستقام الورشة يوم الخميس. تأكيد حجز القاعة قيد الانتظار.'));
const unknowns = l('Flag unknowns clearly', 'حدِّد المعلومات غير المعروفة بوضوح');
const evidence = l('Preserve the supplied facts', 'حافظ على الحقائق المقدَّمة');

export const workflows = [
    workflow('blank', 'internal', l('Blank prompt', 'موجّه فارغ'), l('Build a prompt for a task of your own.', 'أنشئ موجّهًا لمهمة تختارها.'),
        l('Complete the task using the supplied context and requirements.', 'أكمل المهمة وفق السياق والمتطلبات المقدَّمة.'),
        [
            field('TASK', l('Task', 'المهمة'), l('What should the assistant do?', 'ما المطلوب من المساعد؟'), l('Draft a checklist for hosting a workshop.', 'أعدّ قائمة تحقق لتنظيم ورشة.')),
            field('CONTEXT', l('Context', 'السياق'), l('What information should it use?', 'ما المعلومات التي ينبغي استخدامها؟'), l('Twenty people will attend in person.', 'سيحضر عشرون شخصًا حضوريًا.'), false),
            field('CONSTRAINTS', l('Constraints', 'القيود'), l('What limits must the answer respect?', 'ما القيود التي يجب أن يراعيها الرد؟'), l('Keep the checklist to one page.', 'اجعل القائمة في صفحة واحدة.'), false),
        ], [evidence, unknowns]),
    workflow('draft-email', 'everyday', l('Draft an email', 'صياغة بريد إلكتروني'), l('Write an email with a clear purpose and next step.', 'اكتب رسالة بهدف واضح وخطوة تالية محدّدة.'),
        l('Draft a subject line and an email that makes the requested action clear. Use the supplied facts.', 'صغ عنوانًا ورسالة توضّح الإجراء المطلوب. استخدم الحقائق المقدَّمة.'),
        [
            recipient,
            field('GOAL', l('Purpose', 'الهدف'), l('What should the email achieve?', 'ما الذي تريد تحقيقه من الرسالة؟'), l('Ask volunteers to confirm whether they can attend Thursday.', 'اطلب من المتطوعين تأكيد إمكانية حضورهم يوم الخميس.')),
            field('DETAILS', l('Details to include', 'التفاصيل المطلوب ذكرها'), l('Add any date, location, or constraint you know.', 'أضف أي تاريخ أو موقع أو قيد تعرفه.'), l('Please reply by Tuesday evening.', 'يرجى الرد بحلول مساء الثلاثاء.'), false),
        ], [l('Supply a relevant subject line', 'قدِّم عنوانًا ملائمًا'), l('State the requested action and any confirmed deadline', 'وضّح الإجراء المطلوب وأي موعد نهائي مؤكَّد')]),
    workflow('summarize-notes', 'everyday', l('Summarize notes', 'تلخيص الملاحظات'), l('Extract the key points and retain uncertainty.', 'استخرج النقاط الأساسية وحافظ على ما لم يُحسم.'),
        l('Summarize the source notes. Identify the main points and distinguish outcomes from open questions.', 'لخّص الملاحظات الأصلية. حدِّد النقاط الأساسية وميّز النتائج عن الأسئلة المفتوحة.'),
        [
            notes,
            field('FOCUS', l('What to focus on', 'محور التلخيص'), l('Name a theme or question that matters to the reader.', 'حدِّد موضوعًا أو سؤالًا يهم القارئ.'), l('Highlight changes to the schedule.', 'أبرز تغييرات الجدول.'), false),
        ], [evidence, l('Identify the main points without losing open questions', 'حدِّد النقاط الأساسية مع إبقاء الأسئلة المفتوحة واضحة')]),
    workflow('study-plan', 'everyday', l('Plan a study schedule', 'إعداد خطة دراسية'), l('Turn a goal and available time into a study plan.', 'حوّل هدفك والوقت المتاح إلى خطة دراسية.'),
        l('Create a study schedule that fits the available time. Include practice, review, and a way to check progress.', 'أنشئ جدولًا يناسب الوقت المتاح. ضمّن التمرين والمراجعة وطريقة للتحقق من التقدّم.'),
        [
            field('GOAL', l('Learning goal', 'هدف التعلّم'), l('What should you be able to do by the end?', 'ما الذي تريد أن تكون قادرًا على فعله في النهاية؟'), l('Solve basic probability questions independently.', 'حل مسائل الاحتمالات الأساسية بشكل مستقل.')),
            field('TIME', l('Time available', 'الوقت المتاح'), l('Give the number of days and time per session.', 'حدِّد عدد الأيام والوقت المخصَّص لكل جلسة.'), l('Four evenings with 30 minutes each.', 'أربع أمسيات، 30 دقيقة لكل منها.')),
            field('LEVEL', l('Starting point', 'نقطة البداية'), l('What do you already know?', 'ماذا تعرف بالفعل؟'), l('I can work with fractions and percentages.', 'أستطيع التعامل مع الكسور والنسب المئوية.'), false),
        ], [l('Fit the schedule into the time provided', 'اجعل الجدول مناسبًا للوقت المتاح'), l('Include observable progress checks', 'أدرج طرقًا ملموسة للتحقق من التقدّم')]),
    workflow('meeting-follow-up', 'everyday', l('Write a meeting follow-up', 'كتابة متابعة اجتماع'), l('Put decisions and action items into a follow-up email.', 'اجمع القرارات والإجراءات في رسالة متابعة.'),
        l('Write a follow-up email with the decisions, open questions, and action items. Include owners and dates where supplied, and mark the others as unknown.', 'اكتب رسالة متابعة تتضمّن القرارات والأسئلة المفتوحة والإجراءات. اذكر المسؤولين والتواريخ عند توفّرها ووضّح ما لم يُحدَّد.'),
        [notes, { ...recipient, required: false }], [l('Keep decisions and open questions distinct', 'ميّز القرارات عن الأسئلة المفتوحة'), l('Preserve confirmed owners and due dates', 'حافظ على المسؤولين والمواعيد المؤكَّدة')]),
    workflow('bug-to-spec', 'engineering', l('Turn a bug report into a spec', 'تحويل بلاغ خلل إلى مواصفات'), l('Turn a functional bug report into a reproducible issue.', 'حوّل بلاغًا وظيفيًا إلى مشكلة قابلة لإعادة الإنتاج.'),
        l('Write an issue title, reproduction steps, observed and expected behavior, open questions, and acceptance checks. Mark inferred steps and separate confirmed facts from hypotheses.', 'اكتب عنوانًا للمشكلة وخطوات إعادة الإنتاج والسلوك الفعلي والمتوقع والأسئلة المفتوحة ومعايير القبول. وضّح الخطوات المستنتجة وميّز الحقائق المؤكَّدة عن الفرضيات.'),
        [
            field('OBSERVED', l('Observed behavior', 'السلوك الفعلي'), l('Describe what happened and where.', 'صِف ما حدث وأين.'), l('After clearing a status filter, the catalogue stays empty.', 'بعد إزالة عامل تصفية الحالة، تبقى القائمة فارغة.')),
            field('EXPECTED', l('Expected behavior', 'السلوك المتوقع'), l('Describe what the user should see instead.', 'صِف ما ينبغي أن يراه المستخدم.'), l('Clearing the filter should restore the full list.', 'يجب أن تعود القائمة الكاملة عند إزالة التصفية.')),
            field('STEPS', l('Confirmed steps', 'الخطوات المؤكَّدة'), l('What did you actually verify?', 'ما الذي تحققت منه بالفعل؟'), l('Open the catalogue, select Open, then use Clear filters.', 'افتح القائمة واختر «مفتوح» ثم اضغط «مسح عوامل التصفية».'), false),
            field('ENVIRONMENT', l('Environment', 'بيئة التشغيل'), l('Include device, version, or uncertainty if relevant.', 'اذكر الجهاز أو الإصدار أو المعلومات غير المؤكَّدة عند الحاجة.'), l('Seen in a desktop browser. Fresh page load is unverified.', 'ظهرت المشكلة في متصفح سطح المكتب. لم يُتحقَّق بعد من تحميل صفحة جديدة.'), false),
        ], [l('State observed and expected behavior', 'اذكر السلوك الفعلي والمتوقع'), l('Separate verified and inferred steps', 'ميّز الخطوات المؤكَّدة عن المستنتجة'), l('Give testable acceptance criteria', 'قدِّم معايير قبول قابلة للاختبار')]),
    workflow('review-pull-request', 'engineering', l('Review a pull request', 'مراجعة طلب دمج'), l('Request an evidence-based review of a change.', 'اطلب مراجعة تغيير استنادًا إلى الأدلة.'),
        l('Review the change for correctness and regressions. Cite supplied evidence. When given only a summary, ask review questions and identify the evidence needed for findings.', 'راجع صحة التغيير وأثره على السلوك الحالي. استشهد بالأدلة المقدَّمة. إذا توفر ملخص فقط، اطرح أسئلة المراجعة وحدِّد الأدلة اللازمة لإثبات النتائج.'),
        [
            field('GOAL', l('Intended change', 'التغيير المقصود'), l('Describe the behavior the change should deliver.', 'صِف السلوك الذي ينبغي أن يحققه التغيير.'), l('Restore focus to the search button when the dialog closes.', 'إعادة التركيز إلى زر البحث عند إغلاق مربع الحوار.')),
            field('DIFF', l('Diff or summary', 'الفروقات أو ملخص التغيير'), l('Paste the relevant diff or describe what changed.', 'ألصق الفروقات ذات الصلة أو صِف ما تغيّر.'), l('Summary only: closeDialog now calls focus() on the search button.', 'ملخص فقط: تستدعي closeDialog الآن ‎focus()‎ على زر البحث.')),
            field('CONCERNS', l('Areas to check', 'جوانب المراجعة'), l('Add specific behaviors or known risks.', 'أضف سلوكًا محددًا أو مخاطر معروفة.'), l('Keyboard dismissal and navigation away from the page.', 'الإغلاق بلوحة المفاتيح والانتقال خارج الصفحة.'), false),
        ], [l('Tie findings to the supplied evidence', 'اربط النتائج بالأدلة المقدَّمة'), l('Identify regression risks and specific checks', 'حدِّد مخاطر التراجع وفحوصًا محددة')]),
    workflow('implementation-brief', 'engineering', l('Write an implementation brief', 'كتابة موجز تنفيذ'), l('Define a scoped change with checks and open decisions.', 'حدِّد تغييرًا واضح النطاق مع فحوص وقرارات مفتوحة.'),
        l('Write an implementation brief with scope, approach, implementation steps, open questions, and acceptance checks. Label assumptions and identify evidence to consult before changing code.', 'اكتب موجز تنفيذ يتضمّن النطاق والأسلوب والخطوات والأسئلة المفتوحة وفحوص القبول. وضّح الافتراضات وحدِّد الأدلة التي ينبغي الرجوع إليها قبل تغيير الشيفرة.'),
        [
            field('GOAL', l('Goal', 'الهدف'), l('Describe the user-visible outcome.', 'صِف النتيجة التي سيلاحظها المستخدم.'), l('Restore catalogue results when the status filter is cleared.', 'إعادة نتائج القائمة عند إزالة تصفية الحالة.')),
            { ...context, example: l('Clearing the Open filter leaves an empty list until reload.', 'عند إزالة تصفية «مفتوح»، تبقى القائمة فارغة حتى إعادة التحميل.'), required: false },
            field('CONSTRAINTS', l('Constraints', 'القيود'), l('Describe what the implementation must respect.', 'صِف ما يجب أن يراعيه التنفيذ.'), l('Reuse the existing filter controls and preserve keyboard focus.', 'أعد استخدام عناصر التصفية الحالية وحافظ على تركيز لوحة المفاتيح.'), false),
        ], [l('State the intended outcome and bounded scope', 'حدِّد النتيجة المقصودة والنطاق'), l('Provide implementation and verification steps', 'قدِّم خطوات التنفيذ والتحقق')]),
    workflow('handover', 'engineering', l('Write a handover', 'كتابة تسليم عمل'), l('Prepare a handover with status, owners, and next steps.', 'أعدّ تسليمًا يوضح الحالة والمسؤولين والخطوات التالية.'),
        l('Draft a handover with the current state, next actions, known owners, blockers, and open decisions. Mark missing owners or dates as unknown.', 'صغ تسليمًا يتضمّن الحالة الحالية والإجراءات التالية والمسؤولين المعروفين والعوائق والقرارات المفتوحة. وضّح أي مسؤول أو موعد غير محدّد.'),
        [
            recipient,
            field('STATUS', l('Current state', 'الحالة الحالية'), l('What is complete and what remains open?', 'ما الذي اكتمل وما الذي لا يزال مفتوحًا؟'), l('The draft schedule is ready. The room has yet to be confirmed.', 'مسودة الجدول جاهزة. لم يُؤكَّد حجز القاعة بعد.')),
            field('NEXT', l('Next action', 'الإجراء التالي'), l('Give the next step and owner if known.', 'اذكر الخطوة التالية والمسؤول إن كان معروفًا.'), l('Lina will ask facilities to confirm the room.', 'ستطلب لينا من فريق المرافق تأكيد حجز القاعة.')),
            field('BLOCKERS', l('Blockers or references', 'العوائق أو المراجع'), l('Include any known dependency or useful reference.', 'أضف أي متطلّب معروف أو مرجع مفيد.'), l('The room booking is still pending.', 'حجز القاعة لا يزال قيد الانتظار.'), false),
        ], [l('Identify the next action and its owner', 'حدِّد الإجراء التالي والمسؤول عنه'), unknowns]),
    workflow('verification-checklist', 'internal', l('Write a verification checklist', 'كتابة قائمة تحقق'), l('Turn confirmed requirements into checks.', 'حوّل المتطلبات المؤكَّدة إلى فحوص.'),
        l('List checks with setup, actions, and observable results. Include the normal flow and relevant regression cases.', 'أدرج فحوصًا تتضمن الإعداد والخطوات والنتائج القابلة للملاحظة. ضمّن المسار العادي وحالات التراجع ذات الصلة.'),
        [{ ...context, example: l('Clearing the filter should restore the full list.', 'يجب أن تعود القائمة الكاملة عند إزالة التصفية.') }], [evidence, l('Give observable pass criteria', 'قدِّم معايير نجاح قابلة للملاحظة')]),
    workflow('meeting-decisions', 'internal', l('Extract meeting decisions', 'استخراج قرارات الاجتماع'), l('Identify what was agreed and what remains open.', 'حدِّد ما تم الاتفاق عليه وما لا يزال مفتوحًا.'),
        l('Extract confirmed decisions and unresolved questions from the notes. Keep uncertainty visible.', 'استخرج القرارات المؤكَّدة والأسئلة غير المحسومة من الملاحظات. وضّح ما لم يُتحقَّق منه.'),
        [notes], [evidence, unknowns]),
    workflow('meeting-actions', 'internal', l('Organize action items', 'تنظيم الإجراءات'), l('Collect the next steps, owners, and due dates.', 'اجمع الخطوات التالية والمسؤولين والمواعيد.'),
        l('List action items with owners and dates where supplied. Mark unassigned actions and unconfirmed dates explicitly.', 'أدرج الإجراءات مع المسؤولين والتواريخ إن توفّرت. ميّز الإجراءات غير المسندة والمواعيد غير المؤكَّدة بوضوح.'),
        [context], [evidence, unknowns]),
];

export const presets = workflows.filter(item => item.group !== 'internal');
export const findWorkflow = (id: string) => workflows.find(item => item.id === id);

export const chains = [
    { id: 'bug-fix', title: l('Bug report to verified fix', 'من بلاغ الخلل إلى التحقق من الإصلاح'), steps: ['bug-to-spec', 'implementation-brief', 'verification-checklist'], carry: ['CONTEXT', 'CONTEXT'] },
    { id: 'meeting-actions', title: l('Meeting notes to follow-up', 'من ملاحظات الاجتماع إلى المتابعة'), steps: ['meeting-decisions', 'meeting-actions', 'meeting-follow-up'], carry: ['CONTEXT', 'NOTES'] },
];
