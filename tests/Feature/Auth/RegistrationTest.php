<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $this->seedRoles();

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'dni' => '30111222',
            'birth_date' => '1990-01-01',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('doctors.index', absolute: false));
    }
}
