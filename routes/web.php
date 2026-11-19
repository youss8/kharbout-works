<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'Browse')->name('catalogue.index');
Route::inertia('/entries/keyboard-shortcut-label', 'Entry')->name('catalogue.entry');
