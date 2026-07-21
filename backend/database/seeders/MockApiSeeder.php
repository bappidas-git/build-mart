<?php

namespace Database\Seeders;

use App\Models\MockApiResource;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MockApiSeeder extends Seeder
{
    public function run(): void
    {
        $dbPath = base_path('../db.json');
        if (! file_exists($dbPath)) {
            return;
        }

        $payload = json_decode(file_get_contents($dbPath), true);
        foreach ($payload as $resource => $items) {
            if (! is_array($items)) {
                continue;
            }

            foreach ($items as $item) {
                $resourceId = (string) ($item['id'] ?? Str::uuid()->toString());
                MockApiResource::updateOrCreate(
                    ['resource' => $resource, 'resource_id' => $resourceId],
                    ['payload' => $item]
                );
            }
        }
    }
}
