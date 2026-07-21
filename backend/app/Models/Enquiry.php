<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enquiry extends Model
{
    protected $fillable = [
        'enquiry_number',
        'user_id',
        'type',
        'status',
        'contact',
        'items',
        'amount_payable',
        'store_credit_used',
        'status_history',
    ];

    protected $casts = [
        'contact' => 'array',
        'items' => 'array',
        'status_history' => 'array',
        'amount_payable' => 'float',
        'store_credit_used' => 'float',
    ];
}
