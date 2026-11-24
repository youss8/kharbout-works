<section class="kit-panel">
  <label><input type="checkbox" wire:model.live="mix"> Attempt mixed-currency total</label>
  @if($reason=$this->mixError())<div role="alert" class="error-card">{{ $reason }}<button wire:click="$set('mix', false)">Retry per currency</button></div>@endif
  <div class="kit-grid">@foreach($this->balances() as $code=>$amount)<bdi class="kit-cell">{{ number_format($amount/100,2) }} {{ $code }}</bdi>@endforeach</div>
  <label><input type="checkbox" wire:model.live="eligible"> Annual leave entitlement</label>
  @if(!$eligible)<p>This contract has no annual leave entitlement.</p>@else
  <label>Used hours<input type="range" min="0" max="160" step=".25" wire:model.live="used"></label>
  <label><input type="checkbox" wire:model.live="credit"> Include 8h overtime credit</label>
  <label><input type="checkbox" wire:model.live="pending"> Reserve 16h pending</label>
  <p>120h entitlement @if($credit) + 8h credit @endif − {{ $used }}h used @if($pending) − 16h pending @endif</p>
  @php
    $capacity = 120 + ($credit ? 8 : 0);
    $usedWidth = min(100,max(0,100*$used/$capacity));
    $pendingWidth = min(100-$usedWidth,100*($pending?16:0)/$capacity);
  @endphp
  <div class="balance-bands" role="img" aria-label="Used {{ $used }} hours, reserved {{ $pending?16:0 }} hours, remaining {{ $this->hours() }} hours">
    <i class="used" style="width:{{ $usedWidth }}%"></i><i class="reserved" style="width:{{ $pendingWidth }}%"></i>
    @if($credit)<i class="credit" style="inset-inline-start:{{ 100*120/$capacity }}%"></i>@endif
  </div>
  @if($this->hours()<0)<span>△ Overdrawn</span>@endif
  @php($minutes=(int)round(abs($this->hours())*60))
  <output class="kit-cell">Remaining balance <bdi class="kit-value">{{ $this->hours() < 0 ? '−' : '' }}{{ intdiv($minutes,480) }}d {{ intdiv($minutes%480,60) }}h {{ $minutes%60 }}m</bdi>{{ $this->hours() }} hours</output>
  @endif
</section>
