<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CareerDepartment extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
    ];
}
