<?php

namespace App\Livewire;

use Illuminate\Support\Facades\Vite;
use Livewire\Attributes\Renderless;
use Livewire\Component;

class PrivateFilePreview extends Component
{
    // Private files never enter a Livewire request. Only the preview shell is server-rendered.
    #[Renderless]
    public function previewModule(): string
    {
        return Vite::asset('resources/js/office-preview/register.ts');
    }

    #[Renderless]
    public function previewAdjacent(int $direction, int $index, int $fileCount): int
    {
        abort_unless(in_array($direction, [-1, 1], true) && $fileCount >= 1 && $index >= 0 && $index < $fileCount, 422);

        return max(0, min($index + $direction, $fileCount - 1));
    }

    public function render()
    {
        return view('livewire.office-pdf-preview');
    }
}
