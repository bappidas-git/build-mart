<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroConfig extends Model
{
    protected $fillable = [
        'enabled',
        'autoplay_ms',
        'slides',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'autoplay_ms' => 'integer',
        'slides' => 'array',
    ];

    public static function singleton(): self
    {
        return static::query()->first() ?? static::create([
            'enabled' => true,
            'autoplay_ms' => 6000,
            'slides' => [],
        ]);
    }

    public function toConfigObject(): array
    {
        return [
            'enabled' => (bool) $this->enabled,
            'autoplayMs' => (int) $this->autoplay_ms,
            'slides' => $this->slides ?? [],
            'updatedAt' => optional($this->updated_at)->toISOString(),
        ];
    }
}
