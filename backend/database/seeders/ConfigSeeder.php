<?php

namespace Database\Seeders;

use App\Models\CareersPage;
use App\Models\Deal;
use App\Models\HeroConfig;
use App\Models\TestimonialPage;
use Illuminate\Database\Seeder;

class ConfigSeeder extends Seeder
{
    /**
     * Seed the heroConfig, dealsConfig, careersPage and testimonialsPage
     * singletons with the db.json fixture data.
     */
    public function run(): void
    {
        $slides = [
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
        ];

        $heroConfig = HeroConfig::create([
            'enabled' => true,
            'autoplay_ms' => 6000,
            'slides' => $slides,
        ]);
        $heroConfig->syncSlidesRelation($slides);

        Deal::create([
            'enabled' => false,
            'header_cta_enabled' => true,
        ]);

        CareersPage::create([
            'enabled' => true,
            'seo' => [
                'title' => 'Careers at North East Build Mart — Build Your Future With Us',
                'description' => 'Join North East Build Mart, Nagaon\'s trusted building-materials supplier. Open roles in sales, operations, logistics, accounts and marketing. Apply online.',
            ],
            'hero' => [
                'eyebrow' => 'Careers at North East Build Mart',
                'title' => 'Build the future of',
                'highlight' => 'building materials',
                'subtitle' => 'We\'re a growing team in Nagaon, Assam bringing the building-materials trade online for the entire North East. Do work that a whole region can see rise around it.',
                'image' => 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80',
                'primaryCtaLabel' => 'View Open Positions',
                'secondaryCtaLabel' => 'How We Hire',
                'stats' => [
                    [
                        'value' => '15+',
                        'label' => 'Team members',
                    ],
                    [
                        'value' => '11+',
                        'label' => 'Product categories',
                    ],
                    [
                        'value' => '2 days',
                        'label' => 'Avg. first response',
                    ],
                    [
                        'value' => '100%',
                        'label' => 'Local hiring',
                    ],
                ],
            ],
            'why_join_us' => [
                'enabled' => true,
                'title' => 'Why join us',
                'subtitle' => 'Real reasons, not perks-page filler.',
                'items' => [
                    [
                        'icon' => 'mdi:trending-up',
                        'title' => 'A business that\'s genuinely growing',
                        'text' => 'New categories, new site, new customers every month — growth here isn\'t a slide in a deck, it\'s trucks leaving the yard.',
                    ],
                    [
                        'icon' => 'mdi:account-voice',
                        'title' => 'Your ideas reach the owner',
                        'text' => 'No seven layers of approvals. Good ideas get tried within a week, and you get the credit.',
                    ],
                    [
                        'icon' => 'mdi:home-heart',
                        'title' => 'Work where you live',
                        'text' => 'Serve the community you belong to — in the North East, for the North East.',
                    ],
                    [
                        'icon' => 'mdi:school-outline',
                        'title' => 'Learn the whole trade',
                        'text' => 'Sales, stock, logistics, accounts — a small ambitious company teaches you the entire business, fast.',
                    ],
                ],
            ],
            'culture' => [
                'enabled' => true,
                'title' => 'Company culture',
                'subtitle' => 'What working here actually feels like.',
                'image' => 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80',
                'values' => [
                    [
                        'icon' => 'mdi:handshake',
                        'title' => 'Straight talk',
                        'text' => 'With customers and with each other. Honest quotes, honest feedback, no politics.',
                    ],
                    [
                        'icon' => 'mdi:clock-check-outline',
                        'title' => 'Keep promises',
                        'text' => 'A delivery date is a promise. A callback is a promise. We keep them.',
                    ],
                    [
                        'icon' => 'mdi:human-greeting-variant',
                        'title' => 'Respect every role',
                        'text' => 'The helper who loads the truck and the accountant who closes GST both make the promise real.',
                    ],
                    [
                        'icon' => 'mdi:lightbulb-on-outline',
                        'title' => 'Try things',
                        'text' => 'New display, new reel, new route plan — experiments are cheap, standing still is expensive.',
                    ],
                ],
            ],
            'benefits' => [
                'enabled' => true,
                'title' => 'Employee benefits',
                'subtitle' => 'Straightforward and honoured on time, every time.',
                'items' => [
                    [
                        'icon' => 'mdi:cash-multiple',
                        'title' => 'Salary on the 1st',
                        'text' => 'Paid on time, every month — plus role-based incentives.',
                    ],
                    [
                        'icon' => 'mdi:gift-outline',
                        'title' => 'Festival bonus',
                        'text' => 'Bihu and Puja bonuses for every team member.',
                    ],
                    [
                        'icon' => 'mdi:certificate-outline',
                        'title' => 'Skill training',
                        'text' => 'Product, Tally, GST and digital-marketing upskilling paid by us.',
                    ],
                    [
                        'icon' => 'mdi:cellphone-check',
                        'title' => 'Mobile allowance',
                        'text' => 'For customer-facing and coordination roles.',
                    ],
                    [
                        'icon' => 'mdi:shield-check-outline',
                        'title' => 'ESI / PF',
                        'text' => 'Statutory benefits as applicable to your role.',
                    ],
                    [
                        'icon' => 'mdi:stairs-up',
                        'title' => 'Clear growth path',
                        'text' => 'Defined next role and salary band for every position.',
                    ],
                ],
            ],
            'growth' => [
                'enabled' => true,
                'title' => 'Growth opportunities',
                'subtitle' => 'Where a role here can take you.',
                'items' => [
                    [
                        'icon' => 'mdi:account-arrow-up-outline',
                        'title' => 'Executive → Manager',
                        'text' => 'Every manager we have was promoted from within. Prove the craft, then lead it.',
                    ],
                    [
                        'icon' => 'mdi:storefront-plus-outline',
                        'title' => 'New branches, new seats',
                        'text' => 'Expansion across the North East means new supervisor and manager seats to fill — by people already here.',
                    ],
                    [
                        'icon' => 'mdi:laptop',
                        'title' => 'Offline → online skills',
                        'text' => 'Work on a real e-commerce operation: catalogue, campaigns, analytics — skills that travel anywhere.',
                    ],
                ],
            ],
            'life' => [
                'enabled' => true,
                'title' => 'Life at North East Build Mart',
                'subtitle' => 'The floor, the yard, the team.',
                'images' => [
                    [
                        'url' => 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80',
                        'caption' => 'On the floor',
                    ],
                    [
                        'url' => 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=900&q=80',
                        'caption' => 'Material inspection',
                    ],
                    [
                        'url' => 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?auto=format&fit=crop&w=900&q=80',
                        'caption' => 'Team huddle',
                    ],
                    [
                        'url' => 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
                        'caption' => 'Planning the week',
                    ],
                ],
            ],
            'hiring_process' => [
                'enabled' => true,
                'title' => 'How we hire',
                'subtitle' => 'Simple, fast and human — most roles close within two weeks.',
                'steps' => [
                    [
                        'icon' => 'mdi:file-document-edit-outline',
                        'title' => 'Apply online',
                        'text' => 'Fill the short form for the role — takes about five minutes.',
                    ],
                    [
                        'icon' => 'mdi:phone-in-talk-outline',
                        'title' => 'Phone screen',
                        'text' => 'A 15-minute call within 2–3 working days to understand your background.',
                    ],
                    [
                        'icon' => 'mdi:account-group-outline',
                        'title' => 'Meet the team',
                        'text' => 'One in-person round at the store with your future manager — practical, not puzzles.',
                    ],
                    [
                        'icon' => 'mdi:file-sign',
                        'title' => 'Offer & join',
                        'text' => 'A clear written offer. Most people start within two weeks.',
                    ],
                ],
            ],
            'faqs' => [
                'enabled' => true,
                'title' => 'Frequently asked questions',
                'items' => [
                    [
                        'id' => 1,
                        'question' => 'How long does the hiring process take?',
                        'answer' => 'Typically 1–2 weeks from application to offer. Phone screening happens within 2–3 working days of applying.',
                    ],
                    [
                        'id' => 2,
                        'question' => 'Can I apply for more than one role?',
                        'answer' => 'Yes — apply separately to each role you\'re a fit for. Each application is reviewed on its own merit.',
                    ],
                    [
                        'id' => 3,
                        'question' => 'Do you hire freshers?',
                        'answer' => 'For several roles, yes. Each posting lists the experience range; "0" as the minimum means freshers are welcome.',
                    ],
                    [
                        'id' => 4,
                        'question' => 'I applied earlier — can I apply again?',
                        'answer' => 'If it\'s been more than six months, absolutely. Skills and openings both change.',
                    ],
                    [
                        'id' => 5,
                        'question' => 'What should my resume include?',
                        'answer' => 'Keep it to 1–2 pages: your roles, what you actually did, and numbers where possible (sales achieved, stock accuracy, followers grown).',
                    ],
                    [
                        'id' => 6,
                        'question' => 'Whom can I contact about my application?',
                        'answer' => 'Every application gets an Application ID on submission. Call the store or WhatsApp us with that ID for a status update.',
                    ],
                ],
            ],
            'cta' => [
                'enabled' => true,
                'title' => 'Don\'t see the right role?',
                'subtitle' => 'Tell us what you\'re great at — we create roles for exceptional people. Send your resume with a note.',
                'buttonLabel' => 'Contact Us',
            ],
            'openings' => [
                'title' => 'Current openings',
                'subtitle' => 'Every role is based in Nagaon, Assam unless stated otherwise.',
            ],
            'thank_you' => [
                'responseTime' => '2–3 working days',
                'message' => 'Our hiring team reviews every application personally. If your profile matches, we\'ll call you for a quick phone screen.',
            ],
            'notifications' => [
                'recruiterEmail' => 'info@northeastbuildmart.com',
                'sendApplicantEmail' => true,
                'sendAdminEmail' => true,
                'whatsappWebhook' => '',
            ],
        ]);

        TestimonialPage::create([
            'enabled' => true,
            'seo' => [
                'title' => 'Customer Testimonials | North East Build Mart',
                'description' => 'Real stories from contractors, architects and homeowners across the North East who build with materials from North East Build Mart.',
            ],
            'hero' => [
                'kicker' => 'Wall of trust',
                'title' => 'Built on real projects, told by real customers',
                'subtitle' => 'Contractors, architects and homeowners across the North East share how our materials performed on their sites.',
            ],
            'home' => [
                'enabled' => true,
                'kicker' => 'Testimonials',
                'title' => 'What our customers say',
                'subtitle' => 'Real feedback from projects across the North East.',
                'layout' => 'carousel',
                'maxItems' => 6,
                'sort' => 'order',
                'featuredOnly' => false,
                'autoRotate' => true,
                'autoRotateMs' => 6000,
            ],
            'product_page' => [
                'enabled' => true,
                'title' => 'Customer stories with this product',
                'maxItems' => 4,
            ],
            'page' => [
                'layout' => 'masonry',
                'pageSize' => 9,
            ],
        ]);
    }
}
