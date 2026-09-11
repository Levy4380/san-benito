<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class CreateSuperAdminCommandTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    public function test_creates_super_admin_with_default_email(): void
    {
        $this->artisan('super-admin:create', [
            '--password' => 'secretpass',
        ])->expectsOutput('Super admin creado: admin@sanbenito.test')
            ->assertSuccessful();

        $user = User::query()->where('email', 'admin@sanbenito.test')->first();

        $this->assertNotNull($user);
        $this->assertSame('Super Admin', $user->name);
        $this->assertTrue($user->hasRole('super_admin'));
        $this->assertTrue(Hash::check('secretpass', $user->password));
    }

    public function test_prompts_for_password_when_omitted(): void
    {
        $this->artisan('super-admin:create')
            ->expectsQuestion('Contraseña', 'secretpass')
            ->assertSuccessful();

        $this->assertTrue(
            User::query()->where('email', 'admin@sanbenito.test')->exists()
        );
    }

    public function test_fails_without_password_in_non_interactive_mode(): void
    {
        $this->artisan('super-admin:create', ['--no-interaction' => true])
            ->expectsOutput('La contraseña es obligatoria (--password).')
            ->assertFailed();

        $this->assertDatabaseMissing('users', ['email' => 'admin@sanbenito.test']);
    }

    public function test_fails_when_email_already_exists(): void
    {
        $this->seedCatalog();
        $this->makeAdmin(['email' => 'admin@sanbenito.test']);

        $this->artisan('super-admin:create', [
            '--password' => 'secretpass',
        ])->expectsOutput('Ya existe un usuario con el email admin@sanbenito.test.')
            ->assertFailed();
    }

    public function test_rejects_short_password(): void
    {
        $this->artisan('super-admin:create', [
            '--password' => 'short',
        ])->expectsOutput('La contraseña debe tener al menos 8 caracteres.')
            ->assertFailed();
    }
}
