<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    protected $fillable = [
        'name',
        'title',
        'body',
        'rating',
        'image',
        'video_url',
        'status',
        'featured',
        'placements',
        'product_ids',
        'category_ids',
        'sort_order',
    ];

    protected $casts = [
        'placements' => 'array',
        'product_ids' => 'array',
        'category_ids' => 'array',
    ];
}
