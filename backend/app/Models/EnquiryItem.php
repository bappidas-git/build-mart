<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnquiryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'enquiry_id',
        'product_id',
        'name',
        'quantity',
        'price',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'price' => 'float',
    ];

    public function enquiry()
    {
        return $this->belongsTo(Enquiry::class);
    }
}
