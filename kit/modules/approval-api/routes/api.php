<?php

declare(strict_types=1);

use ApprovalApi\Http\ApproveRequestController;
use ApprovalApi\Http\AuthenticateFixtureActor;
use Illuminate\Support\Facades\Route;

Route::post('/requests/{reference}/approve', ApproveRequestController::class)
    ->middleware(AuthenticateFixtureActor::class)
    ->where('reference', '[A-Z]{3}-[0-9]{4}');
