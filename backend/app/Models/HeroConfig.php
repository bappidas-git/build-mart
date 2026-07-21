<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroConfig extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'items',
    ];

    protected $casts = [
        'items' => 'array',
    ];
}
