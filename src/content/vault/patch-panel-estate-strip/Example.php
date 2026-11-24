<?php

namespace App\Livewire;

use Illuminate\Contracts\View\View;
use Livewire\Attributes\Locked;
use Livewire\Component;

class PatchPanelEstateStrip extends Component
{
    #[Locked]
    public array $ports = [];

    #[Locked]
    public int $started;

    #[Locked]
    public int $asOf;

    public function refreshTelemetry(): void
    {
        $this->asOf = strtotime('2026-03-10T10:00:00Z') + max(0, time() - $this->started);
    }

    public string $branch = 'North Hub';

    private const BRANCHES = ['North Hub', 'Harbor Office', 'Central Campus'];

    public function mount(): void
    {
        $this->started = time();
        $this->refreshTelemetry();
        $seed = [
            ['NH-WS-014', 0, 2, 22, 61, 48], ['NH-SRV-FILE', 0, 1, 35, 72, 96],
            ['HO-LT-007', 1, 108, 8, 40, 55], ['HO-WS-021', 1, 3, 91, 88, 63],
            ['CC-WS-003', 2, null, 12, 35, 30], ['CC-SRV-APP', 2, 1, 44, 67, 71],
        ];
        for ($n = 0; $n < 30; $n++) {
            $branch = $n % 10 < 5 ? 0 : ($n % 10 < 8 ? 1 : 2);
            $seed[] = [['NH', 'HO', 'CC'][$branch].'-WS-'.(101 + $n), $branch, $n % 11 === 0 ? null : ($n % 8 === 0 ? 30 : $n % 10), 12 + $n * 7 % 84, 29 + $n * 11 % 68, 21 + $n * 13 % 76];
        }
        foreach ($seed as $i => [$name,$branch,$age,$cpu,$ram,$disk]) {
            $id = $i + 1;
            $this->ports[$id] = ['id' => $id, 'name' => $name, 'branch' => self::BRANCHES[$branch],
                'seen' => $age === null ? null : $this->asOf - $age * 60, 'cpu' => $cpu, 'ram' => $ram, 'disk' => $disk];
        }
    }

    public function outage(): void
    {
        abort_unless(in_array($this->branch, self::BRANCHES, true), 422);
        foreach ($this->ports as &$port) {
            if ($port['branch'] === $this->branch && $port['seen'] !== null) {
                $port['seen'] = $this->asOf - 31 * 60;
            }
        }
    }

    public function checkIn(int $id): void
    {
        abort_unless(isset($this->ports[$id]), 404);
        $this->refreshTelemetry();
        $this->ports[$id]['seen'] = $this->asOf;
    }

    public function render(): View
    {
        $groups = collect($this->ports)->groupBy('branch')->sortByDesc(fn ($ports) => $ports->count());

        return view('livewire.patch-panel-estate-strip', compact('groups'));
    }
}
