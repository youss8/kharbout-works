<?php

namespace App\Livewire;

use Livewire\Attributes\Locked;
use Livewire\Component;

class BilingualAskPalette extends Component
{
    public string $query = '';

    #[Locked]
    public string $selected = '';

    #[Locked]
    public array $recent = [];

    public function ask(string $q): void
    {
        $this->query = mb_substr($q, 0, 200);
    }

    public function pick(string $key): void
    {
        abort_unless(isset(AskIndex::ROWS[$key]), 422);
        $this->recent = array_slice([$key, ...$this->recent], 0, 32);
        $this->selected = AskIndex::ROWS[$key][0];
    }

    public function render()
    {
        return view('livewire.bilingual-ask-palette', ['rows' => AskIndex::search($this->query, $this->recent)]);
    }
}
