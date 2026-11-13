<?php

namespace App\Console\Commands;

use App\Services\PermissionSyncService;
use Illuminate\Console\Command;

class SyncPermissionsCommand extends Command
{
    protected $signature = 'permissions:sync';

    protected $description = 'Sincroniza el catálogo Spatie y los paquetes de rol con App\\Enums\\Permission';

    public function handle(PermissionSyncService $sync): int
    {
        $result = $sync->sync();

        $this->info("Permisos sincronizados: {$result['permissions']} en catálogo, {$result['roles']} roles.");

        return self::SUCCESS;
    }
}
