<?php

namespace App\Livewire;

use Livewire\Attributes\Locked;
use Livewire\Attributes\Renderless;
use Livewire\Component;

class SharedOptions extends Component
{
    #[Locked]
    public array $assigned = [];

    #[Renderless]
    public function toggleAssignee(int $row, int $person): array
    {
        abort_unless($row >= 1 && $row <= 12 && $person >= 1 && $person <= 200, 422);
        $current = $this->assigned[$row] ?? [];

        return $this->assigned[$row] = in_array($person, $current, true)
            ? array_values(array_diff($current, [$person]))
            : [...$current, $person];
    }

    #[Renderless]
    public function directoryOptions(): array
    {
        return array_map(fn (int $id) => ['id' => $id, 'name' => sprintf('Operations officer %03d', $id)], range(1, 200));

    }

    public function render()
    {
        return view('livewire.shared-options-popover');
    }
}
