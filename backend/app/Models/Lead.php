<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'type',
        'name',
        'email',
        'phone',
        'order_number',
        'category',
        'subject',
        'message',
        'status',
        'notes',
    ];
}
