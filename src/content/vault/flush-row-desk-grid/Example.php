<?php

namespace App\Livewire;

use Illuminate\Contracts\View\View;
use Livewire\Attributes\Locked;
use Livewire\Component;

class FlushRowDeskGrid extends Component
{
    private const CATALOG = ['returns' => 6, 'funding' => 6, 'queue' => 8, 'digest' => 4];

    #[Locked]
    public array $saved = self::CATALOG;

    #[Locked]
    public array $draft = self::CATALOG;

    #[Locked]
    public bool $editing = false;

    public function mount(): void
    {
        $stored = session()->get('vault.preview.desk-grid', []);
        $valid = [];
        foreach ((array) $stored as $id => $width) {
            if (array_key_exists($id, self::CATALOG) && is_int($width)) {
                $valid[$id] = max(4, min(12, $width));
            }
        }
        $this->saved = $this->draft = array_merge(...$this->rows($valid + self::CATALOG));
    }

    public function customize(): void
    {
        $this->draft = $this->saved;
        $this->editing = true;
    }

    public function done(): void
    {
        if ($this->editing) {
            $this->saved = $this->draft;
            session()->put('vault.preview.desk-grid', $this->saved);
        }
        $this->editing = false;
    }

    public function cancel(): void
    {
        $this->draft = $this->saved;
        $this->editing = false;
    }

    public function resetGrid(): void
    {
        if ($this->editing) {
            $this->draft = self::CATALOG;
        }
    }

    private function rows(array $panels): array
    {
        $rows = [];
        $row = [];
        foreach ($panels as $id => $cols) {
            if ($row && array_sum($row) + $cols > 12) {
                $row[array_key_last($row)] += 12 - array_sum($row);
                $rows[] = $row;
                $row = [];
            }
            $row[$id] = $cols;
        }
        if ($row) {
            $row[array_key_last($row)] += 12 - array_sum($row);
            $rows[] = $row;
        }

        return $rows;
    }

    public function swap(string $a, string $b): void
    {
        if (! $this->editing || ! isset($this->draft[$a], $this->draft[$b])) {
            return;
        }
        $next = [];
        foreach ($this->draft as $id => $cols) {
            $key = $id === $a ? $b : ($id === $b ? $a : $id);
            $next[$key] = $cols;
        }
        $this->draft = array_merge(...$this->rows($next));
    }

    public function resize(string $id, int $delta): void
    {
        if (! $this->editing || ! isset($this->draft[$id])) {
            return;
        }
        foreach ($this->rows($this->draft) as $row) {
            if (! isset($row[$id]) || count($row) < 2) {
                continue;
            }
            $ids = array_keys($row);
            $i = array_search($id, $ids, true);
            $neighbor = $ids[$i + 1] ?? $ids[$i - 1];
            $amount = max(4 - $row[$id], min($row[$neighbor] - 4, $delta));
            $this->draft[$id] += $amount;
            $this->draft[$neighbor] -= $amount;
        }
    }

    public function render(): View
    {
        return view('livewire.flush-row-desk-grid', ['rows' => $this->rows($this->draft)]);
    }
}
