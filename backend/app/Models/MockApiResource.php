<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MockApiResource extends Model
{
    protected $fillable = [
        'resource',
        'resource_id',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
