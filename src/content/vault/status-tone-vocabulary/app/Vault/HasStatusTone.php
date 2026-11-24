<?php

namespace App\Vault;

interface HasStatusTone
{
    /** @return array{label:string, shape:string, tone:string, glyph:string} */
    public function tone(): array;
}
