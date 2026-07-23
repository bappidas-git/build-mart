<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    public const CAMEL_TO_SNAKE = [
        'sortOrder' => 'sort_order',
        'customerName' => 'customer_name',
        'avatarUrl' => 'avatar_url',
        'reviewDate' => 'review_date',
        'productIds' => 'product_ids',
        'categoryIds' => 'category_ids',
    ];

    protected $fillable = [
        'type',
        'status',
        'featured',
        'sort_order',
        'customer_name',
        'designation',
        'company',
        'avatar_url',
        'rating',
        'title',
        'body',
        'review_date',
        'verified',
        'media',
        'product_ids',
        'category_ids',
        'placements',
        'tags',
        'source',
    ];

    protected $casts = [
        'featured' => 'boolean',
        'verified' => 'boolean',
        'sort_order' => 'integer',
        'rating' => 'integer',
        'review_date' => 'date:Y-m-d',
        'media' => 'array',
        'product_ids' => 'array',
        'category_ids' => 'array',
        'placements' => 'array',
        'tags' => 'array',
    ];

    // The storefront and admin clients read camelCase fields on both branches.
    public function toApiObject(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'status' => $this->status,
            'featured' => (bool) $this->featured,
            'sortOrder' => (int) $this->sort_order,
            'customerName' => $this->customer_name,
            'designation' => $this->designation,
            'company' => $this->company,
            'avatarUrl' => $this->avatar_url,
            'rating' => $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'reviewDate' => optional($this->review_date)->format('Y-m-d'),
            'verified' => (bool) $this->verified,
            'media' => $this->media,
            'productIds' => $this->product_ids ?? [],
            'categoryIds' => $this->category_ids ?? [],
            'placements' => $this->placements ?? new \stdClass(),
            'tags' => $this->tags ?? [],
            'source' => $this->source,
            'createdAt' => optional($this->created_at)->toISOString(),
            'updatedAt' => optional($this->updated_at)->toISOString(),
        ];
    }

    public static function payloadFromRequest(array $input): array
    {
        foreach (static::CAMEL_TO_SNAKE as $camel => $snake) {
            if (array_key_exists($camel, $input) && ! array_key_exists($snake, $input)) {
                $input[$snake] = $input[$camel];
            }
        }

        return array_intersect_key($input, array_flip((new static())->getFillable()));
    }
}
