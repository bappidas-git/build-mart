<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    public const SECTIONS = ['store', 'notifications', 'seo', 'social'];

    protected $fillable = [
        'store',
        'notifications',
        'seo',
        'social',
    ];

    protected $casts = [
        'store' => 'array',
        'notifications' => 'array',
        'seo' => 'array',
        'social' => 'array',
    ];

    public static function singleton(): self
    {
        return static::query()->first() ?? static::create([
            'store' => [],
            'notifications' => [],
            'seo' => [],
            'social' => [],
        ]);
    }

    public function toSettingsObject(): array
    {
        return [
            'store' => $this->store ?? [],
            'notifications' => $this->notifications ?? [],
            'seo' => $this->seo ?? [],
            'social' => $this->social ?? [],
        ];
    }
}
