<?php

namespace App\Livewire;

use Livewire\Attributes\Locked;
use Livewire\Component;

class NeedsActionInbox extends Component
{
    #[Locked]
    public array $items = [
        'leave:81' => ['Annual leave · three days', 1, null, 3, 'Backup coordinator also away 28–30 December'],
        'attendance:28' => ['Attendance correction', 1, null, 2, ''],
        'contract:13' => ['Contract change review', 1, null, 1, ''],
    ];

    #[Locked]
    public ?array $undoItem = null;

    public bool $fault = false;

    public string $outcome = '';

    public function stale(string $key): void
    {
        if (isset($this->items[$key])) {
            $this->items[$key][1]++;
        }
    }

    /** @return array{outcome:'changed'|'already_handled'|'done'} */
    public function decide(string $key, int $version, string $decision): array
    {
        abort_unless(isset($this->items[$key]) && in_array($decision, ['Approve', 'Snooze'], true), 422);
        $result = WorkInbox::checkDecision($this->items[$key], $version);
        if ($result === InboxOutcome::Done) {
            $this->items[$key][1]++;
            $this->items[$key][2] = $decision;
            $this->undoItem = [$key, $this->items[$key][1], microtime(true) + 6];
        }
        $this->outcome = $result->value;

        return ['outcome' => $this->outcome];
    }

    public function undo(): void
    {
        if (! $this->undoItem) {
            return;
        }
        [$key,$version,$until] = $this->undoItem;
        $this->undoItem = null;
        if ($until <= microtime(true) || $this->items[$key][1] !== $version) {
            $this->outcome = 'changed';

            return;
        }
        $this->items[$key][1]++;
        $this->items[$key][2] = null;
        $this->outcome = 'Decision undone.';
    }

    public function render()
    {
        $digest = WorkInbox::digest($this->fault ? 'licenses' : null);

        return view('livewire.needs-action-inbox', compact('digest'));
    }
}
