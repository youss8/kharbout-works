<?php

namespace App\Livewire;

use App\Livewire\Concerns\WithDirtyGuard;
use Livewire\Attributes\Locked;
use Livewire\Component;

class GuardedSchedule extends Component
{
    use WithDirtyGuard;

    #[Locked]
    public array $saved = ['hours' => '5', 'days' => ['1', '3'], 'startTime' => '09:00'];

    #[Locked]
    public int $revision = 1;

    #[Locked]
    public string $message = '';

    #[Locked]
    public string $saveError = '';

    public function saveSchedule(string $hours, array $days, string $startTime = '09:00', bool $reject = false): bool
    {
        $this->saveError = '';
        if ($reject) {
            $this->saveError = 'The demo service rejected this save. Your edits are retained.';

            return false;
        }
        $validator = validator([
            'hours' => trim($hours),
            'days' => $days,
            'startTime' => trim($startTime),
        ], [
            'hours' => ['required', 'numeric', 'between:0,24', 'regex:/^\d+(?:\.\d+)?$/D'],
            'days' => 'array',
            'days.*' => 'in:1,2,3',
            'startTime' => ['required', 'regex:/^(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/D'],
        ]);
        if ($validator->fails()) {
            $this->saveError = $validator->errors()->first();

            return false;
        }
        $this->saved = $this->normalizedSchedule($hours, $days, $startTime);
        $this->message = 'Schedule saved.';

        return true;
    }

    public function resetCredentials(string $word): bool
    {
        validator(['word' => $word], ['word' => 'required|in:RESET'])->validate();
        $this->message = 'Demo credentials reset to revision '.(++$this->revision).'.';

        return true;
    }

    public function recordDecision(string $note): bool
    {
        $note = trim($note);
        validator(compact('note'), ['note' => 'required|string|max:240'])->validate();
        $this->message = 'Decision recorded: '.$note;

        return true;
    }

    public function render()
    {
        return view('livewire.guarded-modals-dirty-close');
    }
}
