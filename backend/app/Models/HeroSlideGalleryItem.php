<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroSlideGalleryItem extends Model
{
    protected $fillable = [
        'hero_slide_id',
        'label',
        'link',
        'image',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function slide()
    {
        return $this->belongsTo(HeroSlide::class, 'hero_slide_id');
    }
}
