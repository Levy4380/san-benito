<?php

namespace Database\Seeders;

use App\Services\PermissionSyncService;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionSyncService::class)->sync();
    }
}
