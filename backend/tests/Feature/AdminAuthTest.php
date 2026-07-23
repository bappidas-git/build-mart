<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(array $overrides = []): Admin
    {
        return Admin::create(array_merge([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@store.com',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'is_active' => true,
        ], $overrides));
    }

    public function test_admin_can_login_with_valid_credentials(): void
    {
        $this->createAdmin();

        $response = $this->postJson('/api/admin/auth/login', [
            'email' => 'admin@store.com',
            'password' => 'admin123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'token',
                    'admin' => ['id', 'email', 'first_name', 'last_name', 'role'],
                ],
            ])
            ->assertJsonPath('data.admin.email', 'admin@store.com')
            ->assertJsonMissingPath('data.admin.password');
    }

    public function test_admin_login_fails_with_wrong_password(): void
    {
        $this->createAdmin();

        $response = $this->postJson('/api/admin/auth/login', [
            'email' => 'admin@store.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Invalid email or password');
    }

    public function test_admin_login_fails_for_inactive_admin(): void
    {
        $this->createAdmin(['is_active' => false]);

        $response = $this->postJson('/api/admin/auth/login', [
            'email' => 'admin@store.com',
            'password' => 'admin123',
        ]);

        $response->assertStatus(401);
    }

    public function test_admin_login_validates_input(): void
    {
        $response = $this->postJson('/api/admin/auth/login', [
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_logout_and_token_is_revoked(): void
    {
        $admin = $this->createAdmin();

        $login = $this->postJson('/api/admin/auth/login', [
            'email' => 'admin@store.com',
            'password' => 'admin123',
        ]);
        $token = $login->json('data.token');

        $this->postJson('/api/admin/auth/logout', [], ['Authorization' => "Bearer {$token}"])
            ->assertOk();

        $this->assertSame(0, $admin->tokens()->count());

        // Reset the cached guard so the replayed token is re-resolved from the database
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/admin/auth/logout', [], ['Authorization' => "Bearer {$token}"])
            ->assertStatus(401);
    }

    public function test_customer_token_cannot_use_admin_logout(): void
    {
        $user = User::create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => Hash::make('Password123!'),
        ]);
        $token = $user->createToken('api-token')->plainTextToken;

        $this->postJson('/api/admin/auth/logout', [], ['Authorization' => "Bearer {$token}"])
            ->assertStatus(401);
    }
}
