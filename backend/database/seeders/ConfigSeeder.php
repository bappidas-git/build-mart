<?php

namespace Database\Seeders;

use App\Models\Deal;
use App\Models\HeroConfig;
use Illuminate\Database\Seeder;

class ConfigSeeder extends Seeder
{
    /**
     * Seed the heroConfig and dealsConfig singletons with the db.json fixture data.
     */
    public function run(): void
    {
        HeroConfig::create([
            'enabled' => true,
            'autoplay_ms' => 6000,
            'slides' => [
            [
                'id' => 'brand',
                'type' => 'brand',
                'enabled' => true,
                'eyebrow' => '',
                'eyebrowColor' => '',
                'logo' => 'https://res.cloudinary.com/dn9gyaiik/image/upload/v1782889446/logo_fnscna.png',
                'title' => 'North East Build Mart',
                'subtitle' => 'Deals in all kinds of building materials for interior and exterior use.',
                'align' => 'center',
                'media' => [
                    'type' => 'image',
                    'url' => 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1920&q=80',
                    'poster' => '',
                ],
                'primaryCta' => [
                    'label' => 'Explore Products',
                    'to' => '/products',
                ],
                'secondaryCta' => [
                    'label' => 'Enquire Now',
                    'to' => 'tel:+918638543526',
                ],
                'gallery' => [],
            ],
            [
                'id' => 'finishes',
                'type' => 'showcase',
                'enabled' => true,
                'eyebrow' => 'Interior & Exterior',
                'eyebrowColor' => '',
                'logo' => '',
                'title' => 'Finishes Built to Last',
                'subtitle' => 'WPC louvers, designer tiles and roofing sheets — the surfaces that define a space.',
                'align' => 'left',
                'media' => [
                    'type' => 'image',
                    'url' => 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=80',
                    'poster' => '',
                ],
                'primaryCta' => [
                    'label' => 'Explore Tiles',
                    'to' => '/products?category=tiles',
                ],
                'secondaryCta' => [
                    'label' => '',
                    'to' => '',
                ],
                'gallery' => [
                    [
                        'label' => 'Tiles',
                        'to' => '/products?category=tiles',
                        'image' => 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'WPC Louvers',
                        'to' => '/products?category=wpc-louvers',
                        'image' => 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'Poly Sheets',
                        'to' => '/products?category=polycarbonate-sheets',
                        'image' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
                    ],
                ],
            ],
            [
                'id' => 'bath',
                'type' => 'showcase',
                'enabled' => true,
                'eyebrow' => 'Kitchen & Bath',
                'eyebrowColor' => '',
                'logo' => '',
                'title' => 'Fittings That Fit Right',
                'subtitle' => 'Bath fittings, plumbing and hardware from the brands builders and contractors rely on.',
                'align' => 'left',
                'media' => [
                    'type' => 'image',
                    'url' => 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80',
                    'poster' => '',
                ],
                'primaryCta' => [
                    'label' => 'Browse Bath Fittings',
                    'to' => '/products?category=bath-fittings',
                ],
                'secondaryCta' => [
                    'label' => '',
                    'to' => '',
                ],
                'gallery' => [
                    [
                        'label' => 'Bath Fittings',
                        'to' => '/products?category=bath-fittings',
                        'image' => 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'Plumbing',
                        'to' => '/products?category=plumbing',
                        'image' => 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'Hardware',
                        'to' => '/products?category=hardware',
                        'image' => 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&q=80',
                    ],
                ],
            ],
            [
                'id' => 'bulk',
                'type' => 'showcase',
                'enabled' => true,
                'eyebrow' => 'Bulk & Project Supply',
                'eyebrowColor' => '',
                'logo' => '',
                'title' => 'Priced for Your Project',
                'subtitle' => 'Cement, steel and waterproofing at project scale — send an enquiry for a tailored bulk quote.',
                'align' => 'left',
                'media' => [
                    'type' => 'image',
                    'url' => 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
                    'poster' => '',
                ],
                'primaryCta' => [
                    'label' => 'Get a Bulk Quote',
                    'to' => '/products?category=cement',
                ],
                'secondaryCta' => [
                    'label' => '',
                    'to' => '',
                ],
                'gallery' => [
                    [
                        'label' => 'Cement',
                        'to' => '/products?category=cement',
                        'image' => 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'Steel Rods',
                        'to' => '/products?category=steel-rods',
                        'image' => 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'Waterproofing',
                        'to' => '/products?category=waterproofing-products',
                        'image' => 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80',
                    ],
                ],
            ],
            [
                'id' => 'doors',
                'type' => 'showcase',
                'enabled' => true,
                'eyebrow' => 'Doors & Entryways',
                'eyebrowColor' => '',
                'logo' => '',
                'title' => 'Doors That Make an Entrance',
                'subtitle' => 'Steel, WPC and designer doors — secure, weather-ready and built to hold up in the North East.',
                'align' => 'left',
                'media' => [
                    'type' => 'image',
                    'url' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
                    'poster' => '',
                ],
                'primaryCta' => [
                    'label' => 'Explore Doors',
                    'to' => '/products?category=doors',
                ],
                'secondaryCta' => [
                    'label' => '',
                    'to' => '',
                ],
                'gallery' => [
                    [
                        'label' => 'Steel Doors',
                        'to' => '/products?category=steel-doors',
                        'image' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'WPC Doors',
                        'to' => '/products?category=wpc-doors',
                        'image' => 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'Designer Doors',
                        'to' => '/products?category=designer-doors',
                        'image' => 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=400&q=80',
                    ],
                ],
            ],
            [
                'id' => 'roofing',
                'type' => 'showcase',
                'enabled' => true,
                'eyebrow' => 'Roofing & Cladding',
                'eyebrowColor' => '',
                'logo' => '',
                'title' => 'Cover Every Span',
                'subtitle' => 'Polycarbonate, FRP and WPC louver panels — daylight, shade and clean lines for any elevation.',
                'align' => 'left',
                'media' => [
                    'type' => 'image',
                    'url' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=80',
                    'poster' => '',
                ],
                'primaryCta' => [
                    'label' => 'Explore Roofing Sheets',
                    'to' => '/products?category=polycarbonate-sheets',
                ],
                'secondaryCta' => [
                    'label' => '',
                    'to' => '',
                ],
                'gallery' => [
                    [
                        'label' => 'Poly Sheets',
                        'to' => '/products?category=polycarbonate-sheets',
                        'image' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'FRP Sheets',
                        'to' => '/products?category=frp-sheets',
                        'image' => 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'WPC Louvers',
                        'to' => '/products?category=wpc-louvers',
                        'image' => 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&q=80',
                    ],
                ],
            ],
            [
                'id' => 'special',
                'type' => 'showcase',
                'enabled' => true,
                'eyebrow' => 'Curated Picks',
                'eyebrowColor' => '',
                'logo' => '',
                'title' => 'Special Products, Hand-Picked',
                'subtitle' => 'A curated edit of standout building materials from across our catalogue — available all year round, not limited-time deals.',
                'align' => 'left',
                'media' => [
                    'type' => 'image',
                    'url' => 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=80',
                    'poster' => '',
                ],
                'primaryCta' => [
                    'label' => 'See Special Products',
                    'to' => '/special-offers',
                ],
                'secondaryCta' => [
                    'label' => '',
                    'to' => '',
                ],
                'gallery' => [
                    [
                        'label' => 'Designer Tiles',
                        'to' => '/products?category=tiles',
                        'image' => 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'Bath Fittings',
                        'to' => '/products?category=bath-fittings',
                        'image' => 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
                    ],
                    [
                        'label' => 'WPC Louvers',
                        'to' => '/products?category=wpc-louvers',
                        'image' => 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=400&q=80',
                    ],
                ],
            ],
        ],
        ]);

        Deal::create([
            'enabled' => false,
            'header_cta_enabled' => true,
        ]);
    }
}
