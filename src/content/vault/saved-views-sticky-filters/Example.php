<?php

namespace App\Livewire;

use App\Livewire\Concerns\HasSavedViews;
use Illuminate\Support\Facades\Gate;
use Livewire\Attributes\Locked;
use Livewire\Component;

class SavedRegisterViews extends Component
{
    use HasSavedViews;

    public string $role = 'Employee';

    public string $query = '';

    public string $name = '';

    public string $sort = 'Ascending';

    public string $notice = '';

    #[Locked]
    public string $region = '';

    #[Locked]
    public array $status = [];

    public array $draft = [];

    public function allowed(): array
    {
        return $this->role === 'Regional HR' && Gate::allows('vault.regional-hr') ? ['Current', 'Ending', 'Restricted'] : ['Current', 'Ending'];
    }

    public function mount(): void
    {
        $this->role = Gate::allows('vault.regional-hr') ? 'Regional HR' : 'Employee';
        $this->restoreTable(session('example.register.filters.'.$this->role, []));
    }

    public function updatedRole(): void
    {
        $this->validate(['role' => 'in:Regional HR,Employee']);
        if ($this->role === 'Regional HR' && ! Gate::allows('vault.regional-hr')) {
            $this->role = 'Employee';
        }
        $current = $this->tableState();
        $trimmed = count(array_diff($current['status'], $this->allowed())) > 0;
        $this->restoreTable(session('example.register.filters.'.$this->role, $current));
        $this->persistFilters();
        $this->notice = $trimmed ? 'Removed filters unavailable to this role.' : 'Role changed.';
    }

    public function updatedQuery(): void
    {
        $this->query = mb_substr(trim($this->query), 0, 100);
        $this->persistFilters();
    }

    public function updatedSort(): void
    {
        $this->validate(['sort' => 'in:Ascending,Descending']);
        $this->persistFilters();
    }

    public function applyFilters(?array $draft = null): void
    {
        $requested = $draft ?? $this->draft;
        $clean = $this->restoreTable([...$this->tableState(), 'status' => $requested]);
        $this->persistFilters();
        $this->notice = $clean ? 'Removed filters unavailable to this role.' : 'Filters applied.';
    }

    public function applyRegion(string $region): void
    {
        abort_unless(in_array($region, ['', 'North', 'East'], true), 422);
        $this->region = $region;
        $this->persistFilters();
    }

    public function render()
    {
        $rows = collect([
            ['Contract A', 'North', 'Ending'], ['Contract B', 'East', 'Current'],
            ['Contract C', 'North', 'Restricted'], ['Contract D', 'East', 'Ending'],
        ])->filter(fn ($row) => in_array($row[2], $this->allowed(), true)
            && (! $this->status || in_array($row[2], $this->status, true)) && (! $this->region || $row[1] === $this->region)
            && str_contains(mb_strtolower($row[0]), mb_strtolower($this->query)));

        return view('livewire.saved-views-sticky-filters', ['rows' => $this->sort === 'Descending' ? $rows->reverse() : $rows, 'views' => $this->roleViews()]);
    }
}
