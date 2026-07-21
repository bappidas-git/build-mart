<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareersPage extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'hero_image',
        'content',
        'enabled',
    ];

    protected $casts = [
        'content' => 'array',
    ];
}
