<?php

namespace App\Livewire;

use Illuminate\Contracts\View\View;
use Livewire\Attributes\Locked;
use Livewire\Component;

class GanttAndTimesheetMachines extends Component
{
    private const NAMES = ['Schema and invariants', 'Live sandboxes', 'Accessibility review', 'Release review'];

    private const DETAILS = [
        ['wbs' => '1.1', 'progress' => 80, 'baselineEnd' => 7, 'proposal' => 'P-014', 'agreement' => 'FA-01'],
        ['wbs' => '1.2', 'progress' => 30, 'baselineEnd' => 15, 'proposal' => 'P-014', 'agreement' => 'FA-01'],
        ['wbs' => '1.3', 'progress' => 15, 'baselineEnd' => 12, 'proposal' => 'P-009', 'agreement' => 'FA-03'],
        ['wbs' => '1.4', 'progress' => 0, 'baselineEnd' => 20, 'proposal' => 'P-009', 'agreement' => 'FA-03'],
    ];

    private const PARENTS = [[], [[0, 0]], [[0, 1]], [[1, 0], [2, 0]]];

    #[Locked]
    public array $rows = [[1, 8], [9, 16], [10, 12], [17, 20]];

    #[Locked]
    public array $history = [];

    #[Locked]
    public array $future = [];

    #[Locked]
    public int $selected = 0;

    #[Locked]
    public int $credit = 0;

    #[Locked]
    public string $status = 'Open';

    #[Locked]
    public string $notice = '';

    #[Locked]
    public array $answers = ['', ''];

    public string $role = 'Employee';

    public bool $self = false;

    #[Locked]
    public bool $consumed = false;

    public function consumption(bool $consumed): void
    {
        abort_unless($this->status === 'Locked' && $this->role === 'HR', 403);
        $this->consumed = $consumed;
    }

    public function selectTask(int $id): void
    {
        abort_unless($id === -1 || isset($this->rows[$id]), 422);
        $this->selected = $id;
    }

    public function move(int $id, int $delta): array
    {
        abort_unless(isset($this->rows[$id]) && abs($delta) <= 366, 422);
        $before = $this->rows;
        foreach ($this->rows as $i => [$start,$end]) {
            $earliest = 1;
            foreach (self::PARENTS[$i] as [$parent,$lag]) {
                $earliest = max($earliest, $this->rows[$parent][1] + 1 + $lag);
            }
            $next = max($earliest, $start + ($i === $id ? $delta : 0));
            $this->rows[$i] = [$next, $end + $next - $start];
        }
        $changes = [];
        foreach ($this->rows as $key => [$startDay,$endDay]) {
            if ($before[$key] !== $this->rows[$key]) {
                $changes[] = ['id' => $key,
                    'before' => ['startDay' => $before[$key][0], 'endDay' => $before[$key][1]],
                    'after' => compact('startDay', 'endDay')];
            }
        }
        $relations = [];
        foreach (self::DETAILS as $task => $detail) {
            $relations['r'.($task + 1)] = ['from' => 'r'.($task + 1), 'to' => $detail['proposal']];
            $relations[$detail['proposal']] = ['from' => $detail['proposal'], 'to' => $detail['agreement']];
        }
        $receipt = ['ok' => count($changes) > 0, 'payload' => ['task' => $id, 'relations' => array_values($relations)], 'changes' => $changes];
        if ($receipt['ok']) {
            $this->history = array_slice([...$this->history, $receipt], -40);
            $this->future = [];
            $this->notice = 'Moved '.count($changes).' tasks.';
        }

        return $receipt;
    }

    private function replay(bool $reverse): array
    {
        $source = $reverse ? 'history' : 'future';
        $destination = $reverse ? 'future' : 'history';
        $receipt = end($this->{$source});
        $failure = ['ok' => false, 'payload' => ['reason' => 'No applicable edit'], 'changes' => []];
        if (! $receipt) {
            return $failure;
        }
        $expect = $reverse ? 'after' : 'before';
        $target = $reverse ? 'before' : 'after';
        $updated = $this->rows;
        $changes = [];
        foreach ($receipt['changes'] as $change) {
            $id = $change['id'];
            $original = $change[$expect];
            $replacement = $change[$target];
            if ($this->rows[$id] !== [$original['startDay'], $original['endDay']]) {
                return ['ok' => false, 'payload' => ['reason' => 'Schedule changed since this edit'], 'changes' => []];
            }
            $updated[$id] = [$replacement['startDay'], $replacement['endDay']];
            $changes[] = ['id' => $id, 'before' => $original, 'after' => $replacement];
        }
        $this->rows = $updated;
        array_pop($this->{$source});
        $this->{$destination}[] = $receipt;
        $this->notice = $reverse ? 'Entire edit undone.' : 'Entire edit restored.';

        return ['ok' => true, 'payload' => $receipt['payload'], 'changes' => $changes];
    }

    public function undo(): array
    {
        return $this->replay(true);
    }

    public function redo(): array
    {
        return $this->replay(false);
    }

    public function answer(int $i, string $value): void
    {
        abort_unless($this->status === 'Open' && $this->role === 'Employee' && isset($this->answers[$i]) && in_array($value, ['Worked', 'Absent', 'Leave'], true), 422);
        $this->answers[$i] = $value;
    }

    public function advance(): void
    {
        if ($this->status === 'Open' && $this->role === 'Employee' && ! in_array('', $this->answers, true)) {
            $this->status = 'Confirmed';
        } elseif ($this->status === 'Confirmed' && $this->role === 'Manager' && ! $this->self) {
            $this->status = 'Approved';
        } elseif ($this->status === 'Approved' && $this->role === 'HR') {
            $this->status = 'Locked';
            $this->credit = 4;
        } elseif ($this->status === 'Locked' && $this->role === 'HR' && ! $this->consumed) {
            $this->status = 'Open';
            $this->credit = 0;
        } else {
            $this->notice = 'Check role, unresolved punches, self-approval and consumed credit.';

            return;
        }
        $this->notice = 'Month is '.$this->status.'.';
    }

    public function exportMonth()
    {
        abort_if(in_array('', $this->answers, true), 422);

        return response()->streamDownload(function () {
            $stream = fopen('php://output', 'wb');
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, ['Date', 'Punches', 'Decision'], ',', '"', '');
            foreach ($this->answers as $i => $answer) {
                fputcsv($stream, [['2026-03-03', '2026-03-09'][$i], [1, 0][$i], $answer], ',', '"', '');
            }
            fclose($stream);
        }, 'march-timesheet.csv');
    }

    public function render(): View
    {
        $names = self::NAMES;
        $details = self::DETAILS;
        $trace = $this->selected === -1 ? array_fill_keys(array_keys($this->rows), true) : [$this->selected => true];
        $roles = $this->selected === -1 ? array_fill_keys(array_keys($this->rows), 'Contained') : [$this->selected => 'Selected'];
        foreach ([true, false] as $up) {
            $seen = [$this->selected => true];
            $queue = [$this->selected];
            while ($queue) {
                $n = array_pop($queue);
                foreach (self::PARENTS as $child => $parents) {
                    foreach ($parents as [$parent]) {
                        [$from,$to] = $up ? [$child, $parent] : [$parent, $child];
                        if ($from === $n && ! isset($seen[$to])) {
                            $trace[$to] = $seen[$to] = true;
                            $roles[$to] = $up ? 'Driver' : 'Dependent';
                            $queue[] = $to;
                        }
                    }
                }
            }
        }
        $finish = max(array_column($this->rows, 1));
        $critical = [];
        for ($id = count($this->rows) - 1; $id >= 0; $id--) {
            if ($this->rows[$id][1] === $finish) {
                $critical[$id] = true;
            }
            if (! isset($critical[$id])) {
                continue;
            }
            foreach (self::PARENTS[$id] as [$parent,$lag]) {
                if ($this->rows[$parent][1] + 1 + $lag === $this->rows[$id][0]) {
                    $critical[$parent] = true;
                }
            }
        }

        $ordered = $this->rows;
        uasort($ordered, fn ($a, $b) => $a[0] <=> $b[0]);
        $lanes = [];
        $ends = [];
        foreach ($ordered as $id => [$start,$end]) {
            $lane = 0;
            while ($lane < 5 && isset($ends[$lane]) && $ends[$lane] >= $start) {
                $lane++;
            }
            $ends[$lane] = max($ends[$lane] ?? 0, $end);
            $lanes[$id] = $lane;
        }
        $days = max(60, max(array_column($this->rows, 1)) + 2);

        return view('livewire.gantt-and-timesheet-machines', compact('names', 'trace', 'critical', 'details', 'lanes', 'days', 'roles'));
    }
}
