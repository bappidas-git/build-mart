<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareerApplication extends Model
{
    protected $fillable = [
        'application_id',
        'job_id',
        'job_snapshot',
        'source',
        'applicant_name',
        'email',
        'phone',
        'fields',
        'resume',
        'status',
        'rating',
        'recruiter_id',
        'notes',
        'status_history',
    ];

    protected $casts = [
        'job_snapshot' => 'array',
        'fields' => 'array',
        'notes' => 'array',
        'status_history' => 'array',
    ];
}
