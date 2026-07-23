<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroConfig extends Model
{
    protected $fillable = [
        'enabled',
        'autoplay_ms',
        'slides',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'autoplay_ms' => 'integer',
        'slides' => 'array',
    ];

    public static function singleton(): self
    {
        return static::query()->first() ?? static::create([
            'enabled' => true,
            'autoplay_ms' => 6000,
            'slides' => [],
        ]);
    }

    public function slidesRelation()
    {
        return $this->hasMany(HeroSlide::class)->orderBy('sort_order');
    }

    // The slides JSON column is canonical for serialization (same pattern as
    // enquiries.items + enquiry_items); the relational rows mirror it.
    public function syncSlidesRelation(array $slides): void
    {
        $this->slidesRelation()->each(function (HeroSlide $slide) {
            $slide->galleryItems()->delete();
            $slide->delete();
        });

        foreach ($slides as $index => $slide) {
            $row = HeroSlide::create([
                'hero_config_id' => $this->id,
                'slide_key' => $slide['id'] ?? null,
                'type' => $slide['type'] ?? 'showcase',
                'enabled' => $slide['enabled'] ?? true,
                'eyebrow' => $slide['eyebrow'] ?? null,
                'eyebrow_color' => $slide['eyebrowColor'] ?? null,
                'logo' => $slide['logo'] ?? null,
                'title' => $slide['title'] ?? null,
                'subtitle' => $slide['subtitle'] ?? null,
                'align' => $slide['align'] ?? null,
                'media_type' => $slide['media']['type'] ?? null,
                'media_url' => $slide['media']['url'] ?? null,
                'media_poster' => $slide['media']['poster'] ?? null,
                'primary_cta_label' => $slide['primaryCta']['label'] ?? null,
                'primary_cta_to' => $slide['primaryCta']['to'] ?? null,
                'secondary_cta_label' => $slide['secondaryCta']['label'] ?? null,
                'secondary_cta_to' => $slide['secondaryCta']['to'] ?? null,
                'sort_order' => $index,
            ]);

            foreach ($slide['gallery'] ?? [] as $galleryIndex => $item) {
                HeroSlideGalleryItem::create([
                    'hero_slide_id' => $row->id,
                    'label' => $item['label'] ?? null,
                    'link' => $item['to'] ?? null,
                    'image' => $item['image'] ?? null,
                    'sort_order' => $galleryIndex,
                ]);
            }
        }
    }

    public function toConfigObject(): array
    {
        return [
            'enabled' => (bool) $this->enabled,
            'autoplayMs' => (int) $this->autoplay_ms,
            'slides' => $this->slides ?? [],
            'updatedAt' => optional($this->updated_at)->toISOString(),
        ];
    }
}
