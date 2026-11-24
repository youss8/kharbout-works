<?php

namespace App\Livewire;

use App\Livewire\Forms\ContractTerms;
use Illuminate\Support\Facades\Gate;
use Livewire\Component;

class RedactedPayDayState extends Component
{
    public string $role = 'Platform Admin';

    public string $day = 'one_punch';

    public ContractTerms $form;

    public array $receipt = [];

    public const DAYS = ['worked', 'one_punch', 'no_record', 'decided_absent', 'leave_pending', 'leave_approved', 'holiday', 'weekend', 'worked_on_day_off', 'decided_present'];

    private function stored(): array
    {
        return session('vault.contract', ['title' => 'Operations Analyst', 'pay' => 4200]);
    }

    public function canViewPay(): bool
    {
        return $this->role === 'HR Manager' && Gate::allows('view-contract-pay');
    }

    public function mount(): void
    {
        $this->updatedRole();
    }

    public function updatedRole(): void
    {
        $stored = $this->stored();
        $this->form->load($stored, $this->canViewPay());
        $this->receipt = [];
    }

    public function save(): void
    {
        $patch = $this->form->validatedPatch($this->canViewPay());
        session(['vault.contract' => array_replace($this->stored(), $patch)]);
        $this->receipt = $patch;
    }

    public function decide(bool $present): void
    {
        if (in_array($this->day, ['one_punch', 'no_record'], true)) {
            $this->day = $present ? 'decided_present' : 'decided_absent';
        }
    }

    public function render()
    {
        if (! $this->canViewPay()) {
            // Also remove previously visible fields if a gate was revoked between requests.
            unset($this->form->fields['pay'], $this->receipt['pay']);
        }

        return view('livewire.redacted-pay-day-state');
    }
}
