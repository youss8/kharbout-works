<?php

namespace App\Livewire;

use DateTimeImmutable;
use Livewire\Attributes\Locked;
use Livewire\Component;

class SpreadsheetImporterRegister extends Component
{
    private const SAMPLE = "Extra Tag,Job Name,Interval,Last Run\ncritical-tier,File Server Nightly,24,46022\nprimary,App DB Hourly,1,n/a\nsecondary,Archive Sweep,12,invalid";

    public string $csv = self::SAMPLE;

    public string $search = '';

    public string $error = '';

    #[Locked]
    public array $rows = [1 => ['name' => 'Workstation snapshot', 'interval' => 24, 'last' => '2026-01-05', 'notes' => 'Keep encrypted']];

    #[Locked]
    public array $preview = [];

    #[Locked]
    public array $warnings = [];

    #[Locked]
    public array $payload = [];

    #[Locked]
    public array $diff = [];

    #[Locked]
    public int $editing = 0;

    public bool $details = false;

    public RegisterForm $form;

    public function loadSample(): void
    {
        $this->csv = self::SAMPLE;
        $this->parse();
    }

    public function parse(): void
    {
        $this->preview = [];
        $this->warnings = [];
        $this->error = '';
        $stream = fopen('php://temp', 'w+b');
        fwrite($stream, preg_replace('/^\xEF\xBB\xBF/', '', $this->csv));
        rewind($stream);
        $headers = fgetcsv($stream, 0, ',', '"', '');
        if (! $headers) {
            $this->error = 'A header row is required.';
            fclose($stream);

            return;
        }
        $map = [];
        foreach (RegisterForm::FIELDS as $key => $field) {
            foreach ([$key, $field['label'], ...($field['aliases'] ?? [])] as $alias) {
                $map[preg_replace('/[^\p{L}\p{N}]/u', '', mb_strtolower(trim($alias)))] = $key;
            }
        }
        $line = 1;
        while (($record = fgetcsv($stream, 0, ',', '"', '')) !== false) {
            $line++;
            if ($record === [null]) {
                continue;
            }
            if (count($record) !== count($headers)) {
                $this->warnings[] = "paste.csv:$line · Column count differs from header.";
            }
            $row = ['metadata' => []];
            foreach ($record as $i => $cell) {
                $header = $headers[$i] ?? 'Column '.($i + 1);
                $field = $map[preg_replace('/[^\p{L}\p{N}]/u', '', mb_strtolower(trim($header)))] ?? null;
                if (! $field) {
                    $row['metadata'][$header] = $cell;

                    continue;
                }
                $raw = trim((string) $cell);
                $value = $raw === '' || strtolower($raw) === 'n/a' ? null : $raw;
                if ($value !== null && RegisterForm::FIELDS[$field]['type'] === 'number') {
                    $value = is_numeric($value) ? (float) $value : null;
                }
                if ($value !== null && RegisterForm::FIELDS[$field]['type'] === 'date') {
                    $date = null;
                    if (ctype_digit($value) && strlen($value) <= 5 && (int) $value > 0 && (int) $value !== 60) {
                        $date = (new DateTimeImmutable((int) $value < 60 ? '1899-12-31' : '1899-12-30'))->modify("+$value days");
                    } else {
                        foreach (['!Y-m-d', '!n/j/Y'] as $format) {
                            $candidate = DateTimeImmutable::createFromFormat($format, $value);
                            if ($candidate && ! DateTimeImmutable::getLastErrors()) {
                                $date = $candidate;
                                break;
                            }
                        }
                    }
                    $value = $date?->format('Y-m-d');
                }
                if ($value === null && $raw !== '' && strtolower($raw) !== 'n/a') {
                    $this->warnings[] = "paste.csv:$line · Invalid $field.";
                }
                $row[$field] = $value;
            }
            if (($row['name'] ?? null) === null) {
                $this->warnings[] = "paste.csv:$line · Missing job name.";
            }
            $this->preview[] = $row;
        }
        fclose($stream);
    }

    public function loadRows(): void
    {
        foreach ($this->preview as $row) {
            if (($row['name'] ?? null) !== null) {
                $this->rows[] = $row;
            }
        }
        $this->preview = [];
    }

    public function edit(int $id): void
    {
        abort_unless(isset($this->rows[$id]), 404);
        $this->editing = $id;
        $this->details = false;
        $this->form->load($this->rows[$id]);
    }

    public function cancelEdit(): void
    {
        $this->editing = 0;
        $this->form->reset();
        $this->form->resetValidation();
    }

    public function save(): void
    {
        abort_unless(isset($this->rows[$this->editing]), 404);
        $this->payload = $this->form->cleanForWrite($this->details);
        $this->diff = [];
        foreach ($this->payload as $k => $v) {
            if (($this->rows[$this->editing][$k] ?? null) !== $v) {
                $this->diff[$k] = ['before' => $this->rows[$this->editing][$k] ?? null, 'after' => $v];
            }
        }
        $this->rows[$this->editing] = array_replace($this->rows[$this->editing], $this->payload);
        $this->editing = 0;
    }

    private function visible(): array
    {
        return array_filter($this->rows, fn ($row) => str_contains(mb_strtolower(implode(' ', array_intersect_key($row, RegisterForm::FIELDS))), mb_strtolower(trim($this->search))));
    }

    public function download()
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'wb');
            fwrite($out, "\u{FEFF}");
            fputcsv($out, array_column(RegisterForm::FIELDS, 'label'), ',', '"', '', "\r\n");
            foreach ($this->visible() as $row) {
                $line = [];
                foreach (RegisterForm::FIELDS as $k => $unused) {
                    $v = (string) ($row[$k] ?? '');
                    $line[] = preg_match('/^(?:[\t\r]|\s*[=+@-])/u', $v) ? "'".$v : $v;
                }
                fputcsv($out, $line, ',', '"', '', "\r\n");
            }
            fclose($out);
        }, 'backup-register.csv');
    }

    public function render()
    {
        return view('livewire.spreadsheet-importer-register', ['visible' => $this->visible(), 'columns' => RegisterForm::fields(false), 'editable' => RegisterForm::fields($this->details), 'tones' => array_map(RegisterForm::rowTone(...), $this->rows)]);
    }
}
