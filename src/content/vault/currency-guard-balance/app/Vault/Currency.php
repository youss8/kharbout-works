<?php

namespace App\Vault;

use DomainException;

enum Currency: string
{
    case USD = 'USD';
    case EUR = 'EUR';

    public static function parse(?string $code): self
    {
        return self::tryFrom(strtoupper(trim($code ?? '')))
            ?? throw new DomainException('A supported currency code is required.');
    }
}
