<?php

declare(strict_types=1);

use App\Livewire\GanttAndTimesheetMachines;
use App\Livewire\HtmlSvgSankeyFlow;
use App\Livewire\PatchPanelEstateStrip;

$root = dirname(__DIR__, 2);
require $root.'/test-results/livewire-runtime/vendor/autoload.php';
foreach (['gantt-and-timesheet-machines', 'patch-panel-estate-strip', 'html-svg-sankey-flow'] as $id) {
    require $root.'/src/content/vault/'.$id.'/Example.php';
}

function equal(mixed $actual, mixed $expected, string $label): void
{
    if ($actual !== $expected) {
        throw new RuntimeException($label.' failed');
    }
}

$gantt = new GanttAndTimesheetMachines;
$original = $gantt->rows;
$edit = $gantt->move(0, 2);
$moved = $gantt->rows;
equal($edit['ok'], true, 'Successful change receipt');
equal(array_column($edit['changes'], 'id'), [0, 1, 2, 3], 'All successor changes included');
equal($edit['changes'][3]['after'], ['startDay' => 19, 'endDay' => 22], 'Convergent successor');
$undo = $gantt->undo();
equal($gantt->rows, $original, 'Atomic undo');
equal($undo['changes'][3]['before'], $edit['changes'][3]['after'], 'Reversed receipt');
equal($gantt->redo(), $edit, 'Replayed receipt');
equal($gantt->rows, $moved, 'Restored successor dates');
$gantt->rows[3] = [30, 33];
$stale = $gantt->rows;
equal($gantt->undo()['ok'], false, 'Stale replay rejected');
equal($gantt->rows, $stale, 'Stale changes leave all rows intact');

$panel = new PatchPanelEstateStrip;
$panel->mount();
equal(count($panel->ports), 36, 'Endpoint count');
$initial = $panel->asOf;
$panel->started -= 30;
$panel->refreshTelemetry();
equal($panel->asOf >= $initial + 30, true, 'Poll advances as-of clock');
$panel->outage();
equal($panel->ports[1]['seen'] < $panel->asOf - 900, true, 'Outage changes freshness');
$panel->checkIn(1);
equal($panel->ports[1]['seen'], $panel->asOf, 'Check-in stamps current poll time');

$flow = new HtmlSvgSankeyFlow;
equal(count($flow->flow()['agreements']), 2, 'USD register');
$flow->chooseCurrency('EUR');
equal(array_column($flow->flow()['agreements'], 0), ['FA-03'], 'EUR register');
echo "Gantt change receipts, telemetry polling and per-currency funding passed.\n";
