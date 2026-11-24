<?php

namespace App\Livewire;

use Livewire\Component;

class AmendmentDiffOrgChart extends Component
{
    public string $tab = 'Contract';

    public function mount(): void
    {
        if (request()->query('panel') === 'org') {
            $this->tab = 'Org chart';
        }
    }

    public bool $signed = false;

    public bool $compact = false;

    public bool $hide = false;

    public function switchTerms(): void
    {
        $this->signed = ! $this->signed;
    }

    // Personas apply only to the fictional contract in this isolated example.
    public string $viewer = 'Coordinator';

    private const ORG = [
        ['P1', 'Operations director', null, null, false], ['P2', 'Systems lead', 'P1', null, false],
        ['P3', 'Data analyst', 'P1', null, true], ['P4', 'Service lead', 'P1', null, false], ['P5', 'Support analyst', 'P2', 'P4', false],
    ];

    private function chart(): array
    {
        $levels = [];
        $positions = [];
        $edges = [];
        foreach (self::ORG as [$id,$title,$parent,$tech,$vacant]) {
            if ($this->hide && $vacant) {
                continue;
            }
            $level = $parent === null ? 0 : $positions[$parent]['level'] + 1;
            $levels[$level][] = $id;
            $positions[$id] = compact('id', 'title', 'parent', 'tech', 'vacant', 'level');
        }
        foreach ($levels as $level => $ids) {
            foreach ($ids as $i => $id) {
                $positions[$id]['x'] = 510 * ($i + .5) / count($ids);
                $positions[$id]['y'] = 26 + $level * ($this->compact ? 64 : 94);
            }
        }
        foreach ($positions as $to) {
            foreach (['parent', 'tech'] as $kind) {
                $from = $positions[$to[$kind]] ?? null;
                if (! $from) {
                    continue;
                }
                $edges[] = [$from['x'], $from['y'] + 15, $to['x'], $to['y'] - 15, $kind];
            }
        }

        return [$positions, $edges, 55 + (count($levels) - 1) * ($this->compact ? 64 : 94)];
    }

    public function render()
    {
        [$positions,$edges,$height] = $this->chart();

        $contract = ContractDescriber::describe($this->signed, $this->viewer === 'HR manager');

        return view('livewire.amendment-diff-org-chart', [...$contract, ...compact('positions', 'edges', 'height')]);
    }
}
