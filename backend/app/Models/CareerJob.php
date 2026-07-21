<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareerJob extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'department_id',
        'status',
        'is_active',
        'description',
        'location',
        'employment_type',
        'work_mode',
        'application_form',
        'posted_at',
    ];

    protected $casts = [
        'application_form' => 'array',
    ];
}
