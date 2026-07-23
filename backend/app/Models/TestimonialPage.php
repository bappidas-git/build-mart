<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestimonialPage extends Model
{
    public const SECTIONS = [
        'seo' => 'seo',
        'hero' => 'hero',
        'home' => 'home',
        'productPage' => 'product_page',
        'page' => 'page',
    ];

    protected $fillable = [
        'enabled',
        'seo',
        'hero',
        'home',
        'product_page',
        'page',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'seo' => 'array',
        'hero' => 'array',
        'home' => 'array',
        'product_page' => 'array',
        'page' => 'array',
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
