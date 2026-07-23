<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deal extends Model
{
    protected $fillable = [
        'enabled',
        'header_cta_enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'header_cta_enabled' => 'boolean',
    ];

    public static function singleton(): self
    {
        return static::query()->first() ?? static::create([
            'enabled' => false,
            'header_cta_enabled' => true,
        ]);
    }

    public function toConfigObject(): array
    {
        return [
            'enabled' => (bool) $this->enabled,
            'headerCtaEnabled' => (bool) $this->header_cta_enabled,
            'updatedAt' => optional($this->updated_at)->toISOString(),
        ];
    }
}
