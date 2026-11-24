<?php

namespace App\Livewire;

use App\Vault\WorkState;
use Livewire\Component;

class StatusToneVocabulary extends Component
{
    public bool $held = true;

    public string $rating = '3';

    public function isOnHold(): bool
    {
        return $this->held;
    }

    public string $raw = 'urgent';

    public string $saved = 'Medium';

    public const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

    public function readPriority(): string
    {
        $raw = strtolower(trim($this->raw));
        if ($raw === 'urgent') {
            return 'Critical';
        }
        $index = array_search($raw, array_map('strtolower', self::PRIORITIES), true);

        return $index === false ? 'Unknown · sorted last' : self::PRIORITIES[$index];
    }

    public function save(): void
    {
        $this->validate(['raw' => 'required|in:Critical,High,Medium,Low']);
        $this->saved = $this->raw;
    }

    public function render()
    {
        $urgencies = [
            'work' => ['variant' => 'act', 'label' => 'Active'],
            'done' => null,
            'attn' => ['variant' => 'rush', 'label' => 'Starts in 2d'],
            'stop' => ['variant' => 'late', 'label' => 'Overdue'],
            'wait' => ['variant' => 'soft', 'label' => 'Scheduled'],
        ];

        return view('livewire.status-tone-vocabulary', ['states' => WorkState::cases(), 'urgencies' => $urgencies]);
    }
}
