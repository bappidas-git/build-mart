<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroSlide extends Model
{
    protected $fillable = [
        'hero_config_id',
        'slide_key',
        'type',
        'enabled',
        'eyebrow',
        'eyebrow_color',
        'logo',
        'title',
        'subtitle',
        'align',
        'media_type',
        'media_url',
        'media_poster',
        'primary_cta_label',
        'primary_cta_to',
        'secondary_cta_label',
        'secondary_cta_to',
        'sort_order',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function heroConfig()
    {
        return $this->belongsTo(HeroConfig::class);
    }

    public function galleryItems()
    {
        return $this->hasMany(HeroSlideGalleryItem::class)->orderBy('sort_order');
    }

    public function toSlideObject(): array
    {
        return [
            'id' => $this->slide_key,
            'type' => $this->type,
            'enabled' => (bool) $this->enabled,
            'eyebrow' => $this->eyebrow ?? '',
            'eyebrowColor' => $this->eyebrow_color ?? '',
            'logo' => $this->logo ?? '',
            'title' => $this->title ?? '',
            'subtitle' => $this->subtitle ?? '',
            'align' => $this->align ?? 'left',
            'media' => [
                'type' => $this->media_type ?? 'image',
                'url' => $this->media_url ?? '',
                'poster' => $this->media_poster ?? '',
            ],
            'primaryCta' => [
                'label' => $this->primary_cta_label ?? '',
                'to' => $this->primary_cta_to ?? '',
            ],
            'secondaryCta' => [
                'label' => $this->secondary_cta_label ?? '',
                'to' => $this->secondary_cta_to ?? '',
            ],
            'gallery' => $this->galleryItems->map(fn ($item) => [
                'label' => $item->label ?? '',
                'to' => $item->link ?? '',
                'image' => $item->image ?? '',
            ])->values()->all(),
        ];
    }
}
