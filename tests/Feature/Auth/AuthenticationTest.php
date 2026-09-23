<?php

namespace Tests\Feature\Auth;

use App\Models\Patient;
use App\Models\User;
use App\Support\LocalDemoAccounts;
use Database\Seeders\DemoSeeder;
use Database\Seeders\HealthInsuranceSeeder;
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
        $response->assertRedirect('/');

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
        ])->assertRedirect('/');

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
        ])->assertRedirect('/');

        $this->post('/logout');

        $this->post('/login', [
            'email' => $super->email,
            'password' => 'password',
        ])->assertRedirect('/');

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

    public function test_authenticated_users_are_redirected_from_login_to_role_home(): void
    {
        $patient = $this->makePatient();
        $admin = $this->makeAdmin();

        $this->actingAs($patient->user)->get('/login')->assertRedirect('/');
        $this->actingAs($patient->user)
            ->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Patient/Home'));

        $this->actingAs($admin)->get('/login')->assertRedirect('/');
        $this->actingAs($admin)->get('/')->assertRedirect('/admin/appointments');
        $this->actingAs($patient->user)->get('/admin/appointments')->assertRedirect('/');
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/login');
    }

    public function test_login_demo_accounts_can_authenticate_after_demo_seed(): void
    {
        $this->seed(HealthInsuranceSeeder::class);
        $this->seed(DemoSeeder::class);

        foreach (LocalDemoAccounts::loginPicker() as $account) {
            $this->assertDatabaseHas('users', [
                'email' => $account['email'],
                'name' => $account['name'],
            ]);

            $this->post('/login', [
                'email' => $account['email'],
                'password' => 'password',
            ])->assertRedirect();

            $this->assertAuthenticated();
            $this->post('/logout');
            $this->assertGuest();
        }
    }
}
