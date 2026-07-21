<?php

namespace Tests\Feature;

use Database\Seeders\MockApiSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MockApiEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_lists_products_from_the_mock_catalog(): void
    {
        $this->seed(MockApiSeeder::class);

        $response = $this->getJson('/api/products');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug'],
                ],
            ]);
    }

    public function test_it_accepts_resume_uploads(): void
    {
        $file = UploadedFile::fake()->create('resume.pdf', 64, 'application/pdf');

        $response = $this->postJson('/api/careers/uploads', [
            'resume' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.url', fn (string $url) => str_contains($url, '/storage/resumes/'));
    }
}
