<?php

namespace App\Livewire;

use DateTimeImmutable;
use Livewire\Form;

final class RegisterForm extends Form
{
    public const FIELDS = [
        'name' => ['label' => 'Backup job', 'type' => 'text', 'required' => true, 'aliases' => ['Job name', 'Job']],
        'interval' => ['label' => 'Interval (h)', 'type' => 'number', 'aliases' => ['Interval']],
        'last' => ['label' => 'Last run', 'type' => 'date'],
        'notes' => ['label' => 'Internal notes', 'type' => 'textarea', 'detail' => true],
    ];

    public array $values = [];

    public static function fields(bool $detail): array
    {
        return array_filter(self::FIELDS, fn ($f) => $detail || empty($f['detail']));
    }

    public function load(array $record): void
    {
        $this->values = array_intersect_key($record, self::FIELDS);
        $this->resetValidation();
    }

    public function cleanForWrite(bool $detail): array
    {
        $rules = [];
        foreach (self::fields($detail) as $key => $field) {
            $rules['values.'.$key] = [
                ! empty($field['required']) ? 'required' : 'nullable',
                match ($field['type']) {
                    'number' => 'numeric','date' => 'date_format:Y-m-d',default => 'string'
                },
            ];
        }
        $this->validate($rules);
        $patch = array_intersect_key($this->values, self::fields($detail));
        foreach ($patch as $key => $value) {
            if (is_string($value)) {
                $value = trim($value);
            }
            $patch[$key] = $value === '' ? null : ($value !== null && self::FIELDS[$key]['type'] === 'number' ? (float) $value : $value);
        }

        return $patch;
    }

    public static function rowTone(array $row): array
    {
        if (($row['interval'] ?? null) === null || (float) $row['interval'] === 0.0) {
            return ['neutral', '○', 'Unscheduled'];
        }
        if (($row['last'] ?? null) === null) {
            return ['warn', '◐', 'Run date missing'];
        }
        $next = (new DateTimeImmutable($row['last'].'T00:00:00Z'))->getTimestamp() + 3600 * (float) $row['interval'];

        return $next < strtotime('2026-01-05T12:00:00Z') ? ['crit', '■', 'Backup overdue'] : ['ok', '●', 'Within interval'];
    }
}
