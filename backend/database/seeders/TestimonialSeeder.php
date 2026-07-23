<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    /**
     * Seed the testimonials table with the db.json fixture data.
     */
    public function run(): void
    {
        Testimonial::create([
            'type' => 'text',
            'status' => 'published',
            'featured' => true,
            'sort_order' => 1,
            'customer_name' => 'Ranjit Bora',
            'designation' => 'Site Contractor',
            'company' => 'Bora Constructions, Guwahati',
            'avatar_url' => 'https://randomuser.me/api/portraits/men/32.jpg',
            'rating' => 5,
            'title' => 'WPC louvers transformed our client\'s lobby',
            'body' => 'We used the 3D charcoal WPC louver panels across a 40-foot feature wall in a hotel lobby at Six Mile. Finish is consistent panel to panel, installation was quick, and six months in there is zero warping despite the humidity. NEBM delivered the full lot in two days.',
            'review_date' => '2026-04-18',
            'verified' => true,
            'media' => null,
            'product_ids' => [
                1,
                2,
            ],
            'category_ids' => [
                1,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'wpc',
                'commercial',
                'guwahati',
            ],
            'source' => 'direct',
        ]);

        Testimonial::create([
            'type' => 'text',
            'status' => 'published',
            'featured' => true,
            'sort_order' => 2,
            'customer_name' => 'Priyanka Deka',
            'designation' => 'Interior Designer',
            'company' => 'Studio PD, Nagaon',
            'avatar_url' => 'https://randomuser.me/api/portraits/women/44.jpg',
            'rating' => 5,
            'title' => 'My go-to supplier for every project',
            'body' => 'I\'ve sourced tiles, louvers and bath fittings from North East Build Mart for over a dozen residential projects. The team understands design intent — they\'ll suggest the right finish instead of just quoting the cheapest SKU. Bulk pricing is transparent and delivery is dependable.',
            'review_date' => '2026-03-29',
            'verified' => true,
            'media' => null,
            'product_ids' => [
                9,
                13,
            ],
            'category_ids' => [
                5,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'interior',
                'repeat-customer',
            ],
            'source' => 'google',
        ]);

        Testimonial::create([
            'type' => 'video',
            'status' => 'published',
            'featured' => true,
            'sort_order' => 3,
            'customer_name' => 'Amit Sharma',
            'designation' => 'Homeowner',
            'company' => 'Dibrugarh',
            'avatar_url' => 'https://randomuser.me/api/portraits/men/75.jpg',
            'rating' => 5,
            'title' => 'Our terrace waterproofing, one year later',
            'body' => 'A short walkthrough of our terrace one monsoon after using Dr. Fixit URP supplied by NEBM. Not a single leak.',
            'review_date' => '2026-03-12',
            'verified' => true,
            'media' => [
                'url' => 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
                'poster' => '',
                'caption' => 'Terrace walkthrough after one full monsoon',
            ],
            'product_ids' => [
                7,
            ],
            'category_ids' => [
                4,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'waterproofing',
                'video',
            ],
            'source' => 'youtube',
        ]);

        Testimonial::create([
            'type' => 'photo',
            'status' => 'published',
            'featured' => false,
            'sort_order' => 4,
            'customer_name' => 'Bhaskar Kalita',
            'designation' => 'Architect',
            'company' => 'BK Associates, Tezpur',
            'avatar_url' => 'https://randomuser.me/api/portraits/men/52.jpg',
            'rating' => 5,
            'title' => 'Fluted panels on a clinic facade',
            'body' => 'Teak-finish fluted WPC panels on the street elevation of a dental clinic we designed. The material handled on-site cutting cleanly and the tone matched the render almost exactly.',
            'review_date' => '2026-02-25',
            'verified' => true,
            'media' => [
                'url' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
                'poster' => '',
                'caption' => 'Completed facade, Tezpur clinic project',
            ],
            'product_ids' => [
                2,
            ],
            'category_ids' => [
                1,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'facade',
                'photo',
            ],
            'source' => 'direct',
        ]);

        Testimonial::create([
            'type' => 'text',
            'status' => 'published',
            'featured' => false,
            'sort_order' => 5,
            'customer_name' => 'Mridula Saikia',
            'designation' => 'Homeowner',
            'company' => 'Jorhat',
            'avatar_url' => 'https://randomuser.me/api/portraits/women/68.jpg',
            'rating' => 4,
            'title' => 'Great tiles, honest advice',
            'body' => 'Bought anti-skid bathroom tiles and glossy wall tiles for our new house. The staff talked us out of a more expensive tile that wouldn\'t have suited a wet area — that kind of honesty is rare. One carton arrived with two chipped pieces and they replaced it without fuss.',
            'review_date' => '2026-02-10',
            'verified' => true,
            'media' => null,
            'product_ids' => [
                15,
                12,
            ],
            'category_ids' => [
                5,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'tiles',
                'residential',
            ],
            'source' => 'direct',
        ]);

        Testimonial::create([
            'type' => 'video',
            'status' => 'published',
            'featured' => false,
            'sort_order' => 6,
            'customer_name' => 'Debojit Chetia',
            'designation' => 'Fabricator',
            'company' => 'Chetia Roofing Works, Sivasagar',
            'avatar_url' => 'https://randomuser.me/api/portraits/men/41.jpg',
            'rating' => 5,
            'title' => 'Polycarbonate roofing install timelapse',
            'body' => 'Timelapse of a 900 sq ft polycarbonate canopy we fabricated with NEBM\'s 6mm multiwall sheets. Sheets arrived edge-taped and undamaged.',
            'review_date' => '2026-01-30',
            'verified' => true,
            'media' => [
                'url' => 'https://vimeo.com/76979871',
                'poster' => '',
                'caption' => 'Canopy installation timelapse',
            ],
            'product_ids' => [
                3,
            ],
            'category_ids' => [
                2,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'roofing',
                'video',
            ],
            'source' => 'vimeo',
        ]);

        Testimonial::create([
            'type' => 'text',
            'status' => 'published',
            'featured' => false,
            'sort_order' => 7,
            'customer_name' => 'Nabanita Goswami',
            'designation' => 'Project Manager',
            'company' => 'Greenfield Realty, Guwahati',
            'avatar_url' => 'https://randomuser.me/api/portraits/women/33.jpg',
            'rating' => 5,
            'title' => 'Reliable partner for bulk orders',
            'body' => 'We order steel doors and hardware for our apartment projects in bulk. NEBM\'s quotes are itemised, GST invoices are prompt, and they hold agreed pricing for the full project duration. That predictability matters more than a one-time discount.',
            'review_date' => '2026-01-22',
            'verified' => true,
            'media' => null,
            'product_ids' => [
                19,
                20,
            ],
            'category_ids' => [
                6,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'bulk',
                'b2b',
            ],
            'source' => 'direct',
        ]);

        Testimonial::create([
            'type' => 'photo',
            'status' => 'published',
            'featured' => false,
            'sort_order' => 8,
            'customer_name' => 'Hiren Das',
            'designation' => 'Homeowner',
            'company' => 'Nagaon',
            'avatar_url' => 'https://randomuser.me/api/portraits/men/22.jpg',
            'rating' => 5,
            'title' => 'Living room feature wall',
            'body' => 'Weekend DIY with NEBM\'s WPC louvers — the store team even lent us a spare blade guide. Came out better than the Pinterest reference!',
            'review_date' => '2025-12-15',
            'verified' => true,
            'media' => [
                'url' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
                'poster' => '',
                'caption' => 'Finished feature wall',
            ],
            'product_ids' => [
                1,
            ],
            'category_ids' => [
                1,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'diy',
                'photo',
            ],
            'source' => 'direct',
        ]);

        Testimonial::create([
            'type' => 'video',
            'status' => 'published',
            'featured' => false,
            'sort_order' => 9,
            'customer_name' => 'Pallabi Hazarika',
            'designation' => 'Cafe Owner',
            'company' => 'Brew & Bloom, Guwahati',
            'avatar_url' => 'https://randomuser.me/api/portraits/women/56.jpg',
            'rating' => 5,
            'title' => 'Our cafe renovation story',
            'body' => 'From bare shell to opening day in six weeks — tiles, doors and panels all came from one supplier, which kept the schedule sane.',
            'review_date' => '2025-12-02',
            'verified' => true,
            'media' => [
                'url' => 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                'poster' => 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80',
                'caption' => 'Renovation recap reel',
            ],
            'product_ids' => [
                9,
                19,
            ],
            'category_ids' => [
                5,
                6,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'commercial',
                'video',
            ],
            'source' => 'direct',
        ]);

        Testimonial::create([
            'type' => 'text',
            'status' => 'published',
            'featured' => false,
            'sort_order' => 10,
            'customer_name' => 'Utpal Rajkhowa',
            'designation' => 'Civil Engineer',
            'company' => 'URC Infra, Golaghat',
            'avatar_url' => 'https://randomuser.me/api/portraits/men/64.jpg',
            'rating' => 4,
            'title' => 'Solid waterproofing range',
            'body' => 'Used Fosroc Brushbond on two rooftop slabs. Coverage matched the datasheet and NEBM\'s stock was fresh — check the batch dates elsewhere and you\'ll see why that\'s worth mentioning. Docking one star only because weekend delivery slots fill up fast.',
            'review_date' => '2025-11-20',
            'verified' => true,
            'media' => null,
            'product_ids' => [
                8,
            ],
            'category_ids' => [
                4,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'waterproofing',
            ],
            'source' => 'direct',
        ]);

        Testimonial::create([
            'type' => 'text',
            'status' => 'draft',
            'featured' => false,
            'sort_order' => 11,
            'customer_name' => 'Rituparna Bhuyan',
            'designation' => 'Homeowner',
            'company' => 'Guwahati',
            'avatar_url' => 'https://randomuser.me/api/portraits/women/21.jpg',
            'rating' => 5,
            'title' => 'Beautiful vitrified tiles',
            'body' => 'The double-charge vitrified tiles look premium and were delivered within 48 hours. Waiting for the full house photos before we share more!',
            'review_date' => '2026-05-06',
            'verified' => true,
            'media' => null,
            'product_ids' => [
                13,
            ],
            'category_ids' => [
                5,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'tiles',
            ],
            'source' => 'direct',
        ]);

        Testimonial::create([
            'type' => 'text',
            'status' => 'archived',
            'featured' => false,
            'sort_order' => 12,
            'customer_name' => 'Dipankar Nath',
            'designation' => 'Shop Owner',
            'company' => 'Nath Hardware, Morigaon',
            'avatar_url' => 'https://randomuser.me/api/portraits/men/12.jpg',
            'rating' => 5,
            'title' => 'Old storefront, great memories',
            'body' => 'NEBM supplied everything for our 2024 shop renovation. (Archived after our second renovation testimonial went live.)',
            'review_date' => '2024-08-14',
            'verified' => true,
            'media' => null,
            'product_ids' => [],
            'category_ids' => [
                7,
            ],
            'placements' => [
                'home' => true,
                'page' => true,
                'products' => true,
            ],
            'tags' => [
                'archived-example',
            ],
            'source' => 'direct',
        ]);
    }
}
