<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareersPage extends Model
{
    public const SECTIONS = [
        'seo' => 'seo',
        'hero' => 'hero',
        'whyJoinUs' => 'why_join_us',
        'culture' => 'culture',
        'benefits' => 'benefits',
        'growth' => 'growth',
        'life' => 'life',
        'hiringProcess' => 'hiring_process',
        'faqs' => 'faqs',
        'cta' => 'cta',
        'openings' => 'openings',
        'thankYou' => 'thank_you',
        'notifications' => 'notifications',
    ];

    protected $fillable = [
        'enabled',
        'seo',
        'hero',
        'why_join_us',
        'culture',
        'benefits',
        'growth',
        'life',
        'hiring_process',
        'faqs',
        'cta',
        'openings',
        'thank_you',
        'notifications',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'seo' => 'array',
        'hero' => 'array',
        'why_join_us' => 'array',
        'culture' => 'array',
        'benefits' => 'array',
        'growth' => 'array',
        'life' => 'array',
        'hiring_process' => 'array',
        'faqs' => 'array',
        'cta' => 'array',
        'openings' => 'array',
        'thank_you' => 'array',
        'notifications' => 'array',
    ];

    public static function singleton(): self
    {
        return static::query()->first() ?? static::create(['enabled' => true]);
    }

    public function toConfigObject(): array
    {
        $object = ['enabled' => (bool) $this->enabled];
        foreach (static::SECTIONS as $camel => $column) {
            $object[$camel] = $this->{$column} ?? new \stdClass();
        }
        $object['updatedAt'] = optional($this->updated_at)->toISOString();

        return $object;
    }
}
