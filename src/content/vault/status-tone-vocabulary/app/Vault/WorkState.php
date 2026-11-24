<?php

namespace App\Vault;

enum WorkState: string implements HasStatusTone
{
    case Work = 'work';
    case Done = 'done';
    case Attention = 'attn';
    case Stop = 'stop';
    case Wait = 'wait';

    public function tone(): array
    {
        [$label, $shape, $tone, $glyph] = match ($this) {
            self::Work => ['In progress', 'solid', 'accent', '●'],
            self::Done => ['Approved', 'surface', 'ok', '●'],
            self::Attention => ['Needs review', 'outline', 'warn', '◐'],
            self::Stop => ['Blocked', 'dashed', 'crit', '■'],
            self::Wait => ['Waiting', 'hairline', 'neutral', '○'],
        };

        return compact('label', 'shape', 'tone', 'glyph');
    }
}
