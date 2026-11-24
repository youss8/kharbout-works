<?php

namespace App\Livewire\Concerns;

trait HasSavedViews
{
    private function roleViews(): array
    {
        return array_filter(session('example.register.views', []), fn ($view) => is_array($view) && ($view['role'] ?? null) === $this->role);
    }

    private function tableState(): array
    {
        return ['status' => $this->status, 'region' => $this->region, 'sort' => $this->sort, 'query' => $this->query];
    }

    private function restoreTable(array $state): bool
    {
        $requested = array_filter((array) ($state['status'] ?? []), 'is_string');
        $this->status = array_values(array_intersect($this->allowed(), $requested));
        $this->region = in_array($state['region'] ?? '', ['North', 'East'], true) ? $state['region'] : '';
        $this->query = mb_substr(trim(is_string($state['query'] ?? null) ? $state['query'] : ''), 0, 100);
        $this->sort = ($state['sort'] ?? '') === 'Descending' ? 'Descending' : 'Ascending';
        $this->draft = $this->status;

        return count($requested) !== count($this->status);
    }

    private function persistFilters(): void
    {
        session(['example.register.filters.'.$this->role => $this->tableState()]);
    }

    public function saveView(): void
    {
        $this->name = trim($this->name);
        $this->validate(['name' => 'required|string|max:60', 'query' => 'nullable|string|max:100', 'sort' => 'in:Ascending,Descending', 'region' => 'nullable|in:North,East', 'role' => 'in:Regional HR,Employee']);
        $views = session('example.register.views', []);
        $views[hash('sha256', $this->role.'|'.$this->name)] = ['name' => $this->name, 'role' => $this->role, ...$this->tableState()];
        session(['example.register.views' => array_slice($views, -40, null, true)]);
        $this->name = '';
        $this->notice = 'View saved.';
    }

    public function applyView(string $id): void
    {
        $view = $this->roleViews()[$id] ?? abort(404);
        $this->notice = $this->restoreTable($view) ? 'Removed filters unavailable to this role.' : 'View applied.';
        $this->persistFilters();
    }

    public function deleteView(string $id): void
    {
        abort_unless(isset($this->roleViews()[$id]), 404);
        $views = session('example.register.views', []);
        unset($views[$id]);
        session(['example.register.views' => $views]);
        $this->notice = 'View deleted.';
    }
}
