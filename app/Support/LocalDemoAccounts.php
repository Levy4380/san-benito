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
            ['role' => 'Super admin', 'name' => 'Administrador General', 'email' => 'superadmin@test.test'],
            ['role' => 'Admin', 'name' => 'Cuenta de Secretaria', 'email' => 'admin@test.test'],
            ['role' => 'Profesional', 'name' => 'Cuenta de Doctor', 'email' => 'Doctor@test.test'],
            ['role' => 'Paciente', 'name' => 'Cuenta de Paciente', 'email' => 'paciente@test.test'],
        ];
    }
}
