<?php

namespace App\Livewire;

use Illuminate\Contracts\View\View;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

class HtmlSvgSankeyFlow extends Component
{
    #[Locked]
    public string $currency = 'USD';

    #[Locked]
    public string $picked = '';

    private const AGREEMENTS = [
        ['FA-01', 'SP1', 'P-2026-014', 'USD', 300000],
        ['FA-02', 'SP2', 'P-2026-014', 'USD', 120000],
        ['FA-03', 'SP3', 'P-2026-009', 'EUR', 180000],
    ];

    private const PROJECTS = ['P-2026-014' => ['PRJ-101', 'PRJ-102'], 'P-2026-009' => ['PRJ-102', 'PRJ-103']];

    public function chooseCurrency(string $currency): void
    {
        abort_unless(in_array($currency, ['USD', 'EUR'], true), 422);
        $this->currency = $currency;
        $this->picked = '';
    }

    public function selectNode(string $id): void
    {
        $this->picked = $this->picked === $id ? '' : $id;
    }

    #[Computed]
    public function flow(): array
    {
        $agreements = array_values(array_filter(self::AGREEMENTS, fn ($a) => $a[3] === $this->currency));
        $edges = [];
        $columns = [[], [], []];
        foreach ($agreements as [$id,$s,$p,$currency,$budget]) {
            $columns[0][$s] = $s;
            $columns[1][$p] = $p;
            $edges[$s][$p] = ($edges[$s][$p] ?? 0) + $budget;
            $projects = self::PROJECTS[$p];
            foreach ($projects as $project) {
                $columns[2][$project] = $project;
                $edges[$p][$project] = ($edges[$p][$project] ?? 0) + $budget / count($projects);
            }
        }
        $reverse = [];
        foreach ($edges as $from => $targets) {
            foreach ($targets as $to => $amount) {
                $reverse[$to][$from] = $amount;
            }
        }
        $trace = [];
        foreach ([$edges, $reverse] as $graph) {
            $queue = [$this->picked];
            $visited = [];
            while ($queue) {
                $node = array_pop($queue);
                if (isset($visited[$node])) {
                    continue;
                }
                $trace[$node] = $visited[$node] = true;
                array_push($queue, ...array_keys($graph[$node] ?? []));
            }
        }

        return compact('agreements', 'edges', 'columns', 'trace');
    }

    public function render(): View
    {
        return view('livewire.html-svg-sankey-flow', $this->flow);
    }
}
