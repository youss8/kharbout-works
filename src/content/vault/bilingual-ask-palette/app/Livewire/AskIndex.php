<?php

namespace App\Livewire;

final class AskIndex
{
    public const ROWS = [
        'returns' => ['Monthly site returns', ['العائدات الشهرية', 'reports']],
        'tickets' => ['New support request', ['تذكرة جديدة', 'create']],
        'late' => ['Overdue submissions', ['المتأخرات', 'late']],
        'theme' => ['Dark appearance', ['داكن', 'night']],
        'archive' => ['Historical records', ['كان', 'archive']],
    ];

    private const INTENTS = [
        'new create add جديد جديدة انشاء أضف', 'late overdue breached متأخر متأخرة متأخرات',
        'dark night داكن مظلم ليلي', 'light نهاري فاتح',
    ];

    private static function words(string $text): array
    {
        $text = strtr(mb_strtolower($text), ['أ' => 'ا', 'إ' => 'ا', 'آ' => 'ا', 'ٱ' => 'ا', 'ة' => 'ه', 'ى' => 'ي']);
        $text = preg_replace('/[\x{0610}-\x{061a}\x{0640}\x{064b}-\x{065f}\x{0670}\x{06d6}-\x{06ed}]/u', '', $text);
        $text = preg_replace('/(?<![\p{L}\p{N}])ال(?=\p{Arabic}{3})/u', '', $text);

        return preg_split('/[^\p{L}\p{N}]+/u', $text, -1, PREG_SPLIT_NO_EMPTY);
    }

    private static function swap(string $text): string
    {
        $keys = str_split(chr(96)."qwertyuiop[]asdfghjkl;'zxcvbnm,./");
        $letters = mb_str_split('ذضصثقفغعهخحجدشسيبلاتنمكطئءؤرلىةوزظ');
        $map = array_combine($keys, $letters);
        $map['b'] = 'لا';

        return strtr(mb_strtolower($text), preg_match('/\p{Arabic}/u', $text) ? array_flip($map) : $map);
    }

    private static function wordScore(string $term, string $word): int
    {
        if ($term === $word) {
            return 12;
        }
        $length = mb_strlen($term);
        if ($length >= 2 && str_starts_with($word, $term)) {
            return 9;
        }
        $limit = $length >= 7 ? 2 : ($length >= 4 ? 1 : 0);
        if (! $limit || abs(mb_strlen($word) - $length) > $limit) {
            return 0;
        }
        $letters = mb_str_split($word);
        $previous = range(0, count($letters));
        foreach (mb_str_split($term) as $i => $letter) {
            $next = [$i + 1];
            foreach ($letters as $j => $other) {
                $next[] = min($previous[$j + 1] + 1, $next[$j] + 1, $previous[$j] + (int) ($letter !== $other));
            }
            $previous = $next;
        }
        $distance = end($previous);

        return $distance <= $limit ? 7 - $distance : 0;
    }

    private static function highlights(string $label, array $terms): array
    {
        $parts = preg_split('/([\p{L}\p{M}\p{N}]+)/u', $label, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);

        return array_map(static function ($part) use ($terms) {
            $word = self::words($part)[0] ?? '';
            $match = $word !== '' && array_filter($terms, fn ($t) => self::wordScore($t, $word) > 0);

            return ['text' => $part, 'matched' => (bool) $match];
        }, $parts);
    }

    public static function search(string $query, array $recent): array
    {
        $query = mb_substr(trim($query), 0, 200);
        $ignore = self::words('what is the which show me please find open ما هو هي لي اعرض افتح');
        $intents = array_map(self::words(...), self::INTENTS);
        $rows = [];
        foreach (self::ROWS as $key => [$label,$aliases]) {
            $words = self::words($label);
            $aliasWords = self::words(implode(' ', $aliases));
            $history = 0;
            foreach (array_slice($recent, 0, 32) as $i => $pick) {
                if ($pick === $key) {
                    $history += 2 / (1 + $i / 4);
                }
            }
            $history = min(4, $history);
            $best = null;
            foreach ([$query, self::swap($query)] as $layout => $variant) {
                $terms = array_slice(array_unique(array_diff(self::words($variant), $ignore)), 0, 12);
                if ($query !== '' && ! $terms) {
                    continue;
                }
                $lexical = 0;
                $intent = 0;
                foreach ($terms as $term) {
                    $wordScore = 0;
                    foreach ($words as $word) {
                        $s = self::wordScore($term, $word);
                        if ($s) {
                            $wordScore = max($wordScore, $s + 2);
                        }
                    }
                    foreach ($aliasWords as $word) {
                        $wordScore = max($wordScore, self::wordScore($term, $word));
                    }
                    $matchedIntent = false;
                    foreach ($intents as $family) {
                        if (in_array($term, $family, true) && array_intersect($family, [...$words, ...$aliasWords])) {
                            $matchedIntent = true;
                            break;
                        }
                    }
                    if (! $wordScore && ! $matchedIntent) {
                        continue 2;
                    }
                    $lexical += $wordScore;
                    if ($matchedIntent) {
                        $intent += 4;
                    }
                }
                $penalty = $layout * 3;
                $score = $lexical + $intent + $history - $penalty;
                if ($best !== null && $best['score'] >= $score) {
                    continue;
                }
                $highlights = self::highlights($label, $terms);
                $alias = [];
                if (! array_filter(array_column($highlights, 'matched'))) {
                    foreach ($aliases as $value) {
                        $parts = self::highlights($value, $terms);
                        if (array_filter(array_column($parts, 'matched'))) {
                            $alias = $parts;
                            break;
                        }
                    }
                }
                $best = compact('key', 'label', 'score', 'lexical', 'intent', 'history', 'penalty', 'highlights', 'alias');
            }
            if ($best !== null) {
                $rows[] = $best;
            }
        }
        usort($rows, fn ($a, $b) => $b['score'] <=> $a['score']);

        return $rows;
    }
}
