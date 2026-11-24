<?php

namespace App\Livewire\Forms;

use Livewire\Form;

class ContractTerms extends Form
{
    /** Only fields visible to this viewer enter the Livewire snapshot. */
    public array $fields = [];

    public function load(array $contract, bool $canViewPay): void
    {
        $this->fields = $canViewPay ? $contract : ['title' => $contract['title']];
    }

    public function validatedPatch(bool $canViewPay): array
    {
        $keys = $canViewPay ? ['title', 'pay'] : ['title'];
        $this->fields = array_intersect_key($this->fields, array_flip($keys));
        $rules = ['fields.title' => 'required|string|max:100'];
        if ($canViewPay) {
            $rules['fields.pay'] = 'required|numeric|min:0';
        }
        $this->validate($rules);

        return $this->fields;
    }
}
