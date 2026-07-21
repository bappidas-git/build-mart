<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'category_id',
        'brand',
        'price',
        'sale_price',
        'stock',
        'is_active',
        'featured',
        'special',
        'trending',
        'images',
        'tags',
        'specifications',
        'related_product_ids',
        'frequently_bought_together_ids',
    ];

    protected $casts = [
        'images' => 'array',
        'tags' => 'array',
        'specifications' => 'array',
        'related_product_ids' => 'array',
        'frequently_bought_together_ids' => 'array',
        'price' => 'float',
        'sale_price' => 'float',
    ];
}
