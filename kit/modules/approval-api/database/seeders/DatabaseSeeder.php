<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            [1, 'Casey Reed', 'north', 'author', 'fixture-casey'],
            [2, 'Samira Noor', 'north', 'reviewer', 'fixture-samira'],
            [3, 'Aaron Lin', 'north', 'reviewer', 'fixture-aaron'],
            [4, 'Robin Lin', 'south', 'reviewer', 'fixture-robin'],
        ] as [$id, $name, $branch, $role, $token]) {
            DB::table('approval_actors')->insert([
                'id' => $id,
                'name' => $name,
                'branch' => $branch,
                'role' => $role,
                'token_hash' => hash('sha256', $token),
            ]);
        }

        foreach ([['REQ-1042', 1], ['REQ-1043', 2]] as [$reference, $authorId]) {
            DB::table('approval_requests')->insert([
                'reference' => $reference,
                'author_id' => $authorId,
                'branch' => 'north',
                'state' => 'in_review',
                'version' => 1,
            ]);
        }
    }
}
