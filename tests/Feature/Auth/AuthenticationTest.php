<?php

namespace Tests\Feature\Auth;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesDomainUsers;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use CreatesDomainUsers;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCatalog();
    }

    public function test_login_screen_can_be_rendered(): void
    {
        $this->get('/login')->assertStatus(200);
    }

    public function test_guests_are_redirected_from_home_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();
        $user->assignRole('patient');
        Patient::factory()->create(['user_id' => $user->id]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/home');

        $this->actingAs($user)
            ->get('/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Patient/Home'));
    }

    public function test_doctor_login_goes_to_portal_home(): void
    {
        $doctor = $this->makeDoctor(['email' => 'doc.login@example.com']);

        $this->post('/login', [
            'email' => $doctor->user->email,
            'password' => 'password',
        ])->assertRedirect('/home');

        $this->actingAs($doctor->user)
            ->get('/home')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Doctor/Home'));
    }

    public function test_admin_and_super_admin_login_go_to_staff_appointments(): void
    {
        $admin = $this->makeAdmin(['email' => 'admin.login@example.com']);
        $super = $this->makeSuperAdmin(['email' => 'super.login@example.com']);

        $this->post('/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertRedirect('/admin/appointments');

        $this->post('/logout');

        $this->post('/login', [
            'email' => $super->email,
            'password' => 'password',
        ])->assertRedirect('/admin/appointments');

        $this->actingAs($admin)->get('/home')->assertRedirect('/admin/appointments');
        $this->actingAs($super)->get('/home')->assertRedirect('/admin/appointments');
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/login');
    }
}
