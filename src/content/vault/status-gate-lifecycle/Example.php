<?php

namespace App\Livewire;

use Livewire\Attributes\Locked;
use Livewire\Component;

class StatusGateLifecycle extends Component
{
    private const ROUTES = ['Brief' => ['Draft'], 'Draft' => ['Review'], 'Review' => ['Approved', 'Rejected', 'Draft'], 'Rejected' => ['Draft'], 'Approved' => ['Mobilized'], 'Mobilized' => ['Active'], 'Active' => ['Complete'], 'Complete' => []];

    #[Locked]
    public string $current = 'Review';

    #[Locked]
    public int $version = 1;

    #[Locked]
    public int $expected = 1;

    #[Locked]
    public string $statusExpectedFrom = 'Review';

    #[Locked]
    public array $dates = ['Brief' => '2026-01-12', 'Draft' => '2026-01-20', 'Review' => '2026-02-03'];

    #[Locked]
    public ?array $transitionEvent = null;

    public bool $held = false;

    public bool $signed = false;

    public bool $budget = false;

    public bool $editing = false;

    public string $reason = '';

    public string $target = 'Approved';

    public string $notice = '';

    public function begin(): void
    {
        $this->expected = $this->version;
        $this->target = self::ROUTES[$this->current][0] ?? $this->current;
        $this->reason = '';
        $this->statusExpectedFrom = $this->current;
        $this->signed = false;
        $this->budget = false;
        $this->editing = true;
    }

    public function concurrentEdit(): void
    {
        $this->version++;
    }

    public function reloadVersion(): void
    {
        $this->expected = $this->version;
    }

    private function requirements(): array
    {
        return array_filter([
            $this->version !== $this->expected || $this->statusExpectedFrom !== $this->current ? 'Record changed. Reload the latest version.' : null,
            ! in_array($this->target, self::ROUTES[$this->current], true) ? 'Transition unavailable.' : null,
            $this->held ? 'Release the hold.' : null,
            $this->target === 'Approved' && ! $this->signed ? 'Attach a signed funding agreement.' : null,
            $this->target === 'Approved' && ! $this->budget ? 'Confirm budget and dates.' : null,
            mb_strlen(trim($this->reason)) < 10 ? 'Enter a reason of at least 10 characters.' : null,
        ]);
    }

    public function changeStatus(): void
    {
        if (! $this->editing || $this->requirements()) {
            return;
        }
        $from = $this->current;
        $reason = trim($this->reason);
        $this->current = $this->target;
        $this->dates[$this->current] = '2026-02-04';
        $this->version++;
        $this->transitionEvent = [
            'type' => 'status_changed',
            'from' => $from,
            'to' => $this->current,
            'version' => $this->version,
            'reason' => $reason,
        ];
        $this->editing = false;
        $this->notice = "Moved to {$this->current} · ".$reason;
    }

    public function render()
    {
        $stops = ['Brief', 'Draft', $this->current === 'Rejected' ? 'Rejected' : 'Review', 'Approved', 'Mobilized', 'Active', 'Complete'];
        $index = array_search($this->current, $stops, true);
        $steps = [];
        foreach ($stops as $i => $label) {
            $active = $label === $this->current;
            $state = $label === 'Rejected' ? 'rejected' : ($active ? 'current' : ($i < $index ? 'past' : 'ahead'));
            $glyph = ['rejected' => '■', 'current' => '●', 'past' => '✓', 'ahead' => '○'][$state];
            $date = $i <= $index ? ($this->dates[$label] ?? null) : null;
            $steps[] = compact('label', 'state', 'active', 'glyph', 'date');
        }

        return view('livewire.status-gate-lifecycle', ['steps' => $steps, 'legal' => self::ROUTES[$this->current], 'requirements' => $this->requirements()]);
    }
}
