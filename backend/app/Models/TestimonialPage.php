<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestimonialPage extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'hero_image',
        'content',
        'enabled',
        'home',
        'product_page',
    ];

    protected $casts = [
        'content' => 'array',
        'home' => 'array',
        'product_page' => 'array',
    ];
}
