export interface AskItem {
    key: string;
    label: string;
    aliases?: readonly string[];
}

export function normalizeAr(text: string): string {
    return text
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\u0610-\u061a\u0640\u064b-\u065f\u0670\u06d6-\u06ed]/gu, '')
        .replace(/[أإآٱ]/gu, 'ا')
        .replace(/ة/gu, 'ه')
        .replace(/ى/gu, 'ي')
        .replace(/ال(?=[\p{Script=Arabic}]{3})/gu, (article, offset: number, input: string) =>
            offset === 0 || !/[\p{L}\p{N}]/u.test(input[offset - 1]) ? '' : article,
        );
}

// Physical keys on the common Arabic 101 layout. The B key produces two letters.
const latinKeys = "`qwertyuiop[]asdfghjkl;'zxcvbnm,./";
const arabicKeys = [
    'ذ',
    'ض',
    'ص',
    'ث',
    'ق',
    'ف',
    'غ',
    'ع',
    'ه',
    'خ',
    'ح',
    'ج',
    'د',
    'ش',
    'س',
    'ي',
    'ب',
    'ل',
    'ا',
    'ت',
    'ن',
    'م',
    'ك',
    'ط',
    'ئ',
    'ء',
    'ؤ',
    'ر',
    'لا',
    'ى',
    'ة',
    'و',
    'ز',
    'ظ',
];
const toArabic = new Map(Array.from(latinKeys).map((key, i) => [key, arabicKeys[i]]));
const toLatin = new Map(arabicKeys.map((key, i) => [key, latinKeys[i]]));

export function swapLayout(input: string): string {
    const reverse = /\p{Script=Arabic}/u.test(input);
    const keys = reverse
        ? (input.normalize('NFKC').match(/لا|[\s\S]/gu) ?? [])
        : Array.from(input.toLowerCase());
    return keys.map((key) => (reverse ? toLatin : toArabic).get(key) ?? key).join('');
}

/** Banded Levenshtein distance. A result of limit + 1 means outside the budget. */
export function editDistance(a: string, b: string, limit = Math.max(a.length, b.length)): number {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    let current = Array<number>(b.length + 1).fill(limit + 1);
    for (let row = 1; row <= a.length; row++) {
        current[0] = row;
        const start = Math.max(1, row - limit),
            end = Math.min(b.length, row + limit);
        if (start > 1) current[start - 1] = limit + 1;
        let best = current[0];
        for (let col = start; col <= end; col++) {
            current[col] = Math.min(
                current[col - 1] + 1,
                previous[col] + 1,
                previous[col - 1] + Number(a[row - 1] !== b[col - 1]),
            );
            best = Math.min(best, current[col]);
        }
        if (best > limit) return limit + 1;
        if (end < b.length) current[end + 1] = limit + 1;
        [previous, current] = [current, previous];
    }
    return Math.min(previous[b.length], limit + 1);
}

const wordPattern = /[\p{L}\p{M}\p{N}\u0640]+/gu;
const tokens = (value: string): string[] => normalizeAr(value).match(wordPattern) ?? [];
const stopWords = new Set(
    tokens('what is the which show me please find open ما هو هي لي اعرض افتح'),
);
const intentFamilies = [
    tokens('new create add جديد جديدة انشاء أضف'),
    tokens('late overdue breached متأخر متأخرة متأخرات متأخره'),
    tokens('dark night داكن مظلم ليلي'),
    tokens('light نهاري فاتح'),
];
function wordScore(term: string, candidate: string): number {
    if (term === candidate) return 12;
    if (term.length >= 2 && candidate.startsWith(term)) return 9;
    const limit = term.length >= 7 ? 2 : term.length >= 4 ? 1 : 0;
    if (limit === 0 || Math.abs(term.length - candidate.length) > limit) return 0;
    const distance = editDistance(term, candidate, limit);
    return distance <= limit ? 7 - distance : 0;
}

type Word = { text: string; start: number; end: number };
function labelWords(label: string): Word[] {
    return Array.from(label.matchAll(wordPattern), (match) => ({
        text: normalizeAr(match[0]),
        start: match.index,
        end: match.index + match[0].length,
    }));
}
export function prepareAskIndex<T extends AskItem>(items: readonly T[]) {
    return {
        rows: items.map((item) => ({
            item,
            words: labelWords(item.label),
            aliases: new Set((item.aliases ?? []).flatMap(tokens)),
        })),
    };
}

/** Newest pick is first. Repeated picks contribute less as they age. */
export function frecency(key: string, recent: readonly string[] = []): number {
    return Math.min(
        4,
        recent
            .slice(0, 32)
            .reduce((sum, pick, i) => (pick === key ? sum + 2 / (1 + i / 4) : sum), 0),
    );
}

type Highlight = { text: string; matched: boolean };
type ScoreWord = (term: string, candidate: string) => number;
function highlightWords(
    label: string,
    words: Word[],
    terms: string[],
    compare: ScoreWord,
): Highlight[] {
    const parts: Highlight[] = [];
    let start = 0;
    for (const word of words) {
        if (!terms.some((term) => compare(term, word.text) > 0)) continue;
        if (word.start > start)
            parts.push({ text: label.slice(start, word.start), matched: false });
        parts.push({ text: label.slice(word.start, word.end), matched: true });
        start = word.end;
    }
    if (start < label.length) parts.push({ text: label.slice(start), matched: false });
    return parts;
}

function queryTerms(query: string) {
    return [...new Set(tokens(query).filter((term) => !stopWords.has(term)))].slice(0, 12);
}
function scoreTerms(terms: string[], words: Word[], aliases: Set<string>, compare: ScoreWord) {
    let lexical = 0,
        intent = 0;
    for (const term of terms) {
        let best = 0;
        for (const word of words) {
            const match = compare(term, word.text);
            if (match) best = Math.max(best, match + 2);
        }
        for (const alias of aliases) best = Math.max(best, compare(term, alias));
        const family = intentFamilies.find((family) => family.includes(term));
        const matchesIntent = family?.some(
            (word) => aliases.has(word) || words.some((w) => w.text === word),
        );
        if (!best && !matchesIntent) return null;
        lexical += best;
        if (matchesIntent) intent += 4;
    }
    return { lexical, intent };
}

export function bilingualSearch<T extends AskItem>(
    query: string,
    context: {
        items: readonly T[] | ReturnType<typeof prepareAskIndex<T>>;
        recent?: readonly string[];
    },
) {
    const index = 'rows' in context.items ? context.items : prepareAskIndex(context.items);
    const input = query.trim().slice(0, 200);
    const direct = queryTerms(input),
        swapped = queryTerms(swapLayout(input));
    const variants = [
        { terms: direct, layoutPenalty: 0 },
        { terms: swapped, layoutPenalty: 3 },
    ];
    const scores = new Map<string, number>();
    const compare: ScoreWord = (term, candidate) => {
        const key = term + ' ' + candidate;
        let score = scores.get(key);
        if (score === undefined) {
            score = wordScore(term, candidate);
            scores.set(key, score);
        }
        return score;
    };
    return index.rows
        .flatMap(({ item, words, aliases }) => {
            const history = frecency(item.key, context.recent);
            let selected:
                | {
                      score: number;
                      terms: string[];
                      breakdown: {
                          lexical: number;
                          intent: number;
                          layoutPenalty: number;
                          frecency: number;
                      };
                  }
                | undefined;
            for (const { terms, layoutPenalty } of variants) {
                if (input && !terms.length) continue;
                const match = scoreTerms(terms, words, aliases, compare);
                if (!match) continue;
                const score = match.lexical + match.intent + history - layoutPenalty;
                if (!selected || score > selected.score)
                    selected = {
                        score,
                        terms,
                        breakdown: { ...match, layoutPenalty, frecency: history },
                    };
            }
            if (!selected) return [];
            return [
                {
                    item,
                    score: selected.score,
                    breakdown: selected.breakdown,
                    highlights: highlightWords(item.label, words, selected.terms, compare),
                },
            ];
        })
        .sort((a, b) => b.score - a.score);
}
