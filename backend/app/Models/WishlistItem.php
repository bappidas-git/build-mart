<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WishlistItem extends Model
{
    protected $with = ['product'];

    protected $fillable = [
        'user_id',
        'product_id',
        'slug',
        'name',
        'image',
        'brand',
        'price',
        'compare_price',
        'rating',
        'total_reviews',
        'short_description',
        'variants',
        'stock',
        'trending',
        'hot',
        'added_at',
    ];

    protected $casts = [
        'variants' => 'array',
        'price' => 'float',
        'compare_price' => 'float',
        'rating' => 'float',
        'trending' => 'boolean',
        'hot' => 'boolean',
        'added_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
