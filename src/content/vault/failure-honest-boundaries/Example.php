<?php

namespace App\Livewire;

use Livewire\Attributes\Locked;
use Livewire\Component;

class InventoryBoundary extends Component
{
    #[Locked]
    public array $rows = ['Laptop LT-01', 'جهاز طباعة'];

    #[Locked]
    public int $revision = 1;

    public string $cell = '=SUM(A1:A9)';

    public string $error = '';

    public function refreshInventory(string $mode): void
    {
        $delay = ['fast' => 80000, 'slow' => 900000, 'fail' => 180000][$mode] ?? abort(422);
        usleep($delay);
        if ($mode === 'fail') {
            $this->error = 'Inventory query timed out. Previous rows are shown.';

            return;
        }
        $this->error = '';
        $this->revision++;
        $this->rows = ['Laptop LT-01', 'جهاز طباعة'];
        if ($this->revision % 2 === 0) {
            $this->rows[] = 'Dock DK-04';
        }
    }

    public function escapedCell(string $text): string
    {
        if (preg_match('/^(?:[\t\r]|\s*[=+@-])/u', $text)) {
            $text = "'".$text;
        }

        return '"'.str_replace('"', '""', $text).'"';
    }

    public function download()
    {
        return response()->streamDownload(function () {
            echo "\u{FEFF}\"Item\",\"Notes\"\r\n";
            foreach ($this->rows as $i => $item) {
                echo $this->escapedCell($item).','.$this->escapedCell($i === 0 ? $this->cell : '+24 units')."\r\n";
            }
        }, 'inventory.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function render()
    {
        return view('livewire.failure-honest-boundaries');
    }
}
