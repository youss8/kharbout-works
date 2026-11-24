<?php

namespace App\Livewire;

use Illuminate\Support\Facades\Gate;
use Livewire\Attributes\Renderless;
use Livewire\Component;

class ScopedProfile extends Component
{
    #[Renderless]
    public function switchRole(string $role): string
    {
        // Register these abilities with the application's existing role policy.
        $allowed = match ($role) {
            'Regional HR' => Gate::allows('vault.regional-hr'),
            'Manager' => Gate::allows('vault.manager'),
            'Employee' => true,
            default => false,
        };
        $active = $allowed ? $role : 'Employee';
        session(['vault.profile.role' => $active]);

        return $active;
    }

    #[Renderless]
    public function inspectProfile(int $id): array
    {
        $role = session('vault.profile.role', 'Employee');
        // Re-check the active policy in case privileges changed since the last request.
        if (($role === 'Regional HR' && ! Gate::allows('vault.regional-hr')) || ($role === 'Manager' && ! Gate::allows('vault.manager'))) {
            abort(404);
        }
        $assignments = [42 => 'Site coordination', 88 => 'Restricted contract review', 91 => 'Operations planning'];
        if (! isset($assignments[$id]) || ($id === 88 && $role !== 'Regional HR') || ($id === 91 && $role === 'Employee')) {
            abort(404);
        }

        return ['id' => $id, 'label' => sprintf('Staff %03d', $id), 'assignment' => $assignments[$id]];
    }

    public function render()
    {
        return view('livewire.fail-closed-role-drawer');
    }
}
