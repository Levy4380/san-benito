<?php

namespace App\Support;

final class LocalDemoAccounts
{
    /**
     * Cuentas del selector "Cuenta de prueba" en login (solo local).
     *
     * @return list<array{role: string, name: string, email: string}>
     */
    public static function loginPicker(): array
    {
        return [
            ['role' => 'Super admin', 'name' => 'Super admin', 'email' => 'superadmin@test.test'],
            ['role' => 'Admin', 'name' => 'Secretaria', 'email' => 'admin@test.test'],
            ['role' => 'Doctor', 'name' => 'Doctor', 'email' => 'doctor@test.test'],
            ['role' => 'Paciente', 'name' => 'Paciente', 'email' => 'paciente@test.test'],
        ];
    }
}
