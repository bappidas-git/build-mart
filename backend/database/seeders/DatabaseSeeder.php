<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Appointment;
use App\Models\Banner;
use App\Models\CareerApplication;
use App\Models\CareerDepartment;
use App\Models\CareerJob;
use App\Models\CareerRecruiter;
use App\Models\CareersPage;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Deal;
use App\Models\Enquiry;
use App\Models\HeroConfig;
use App\Models\MockApiResource;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Refund;
use App\Models\Review;
use App\Models\ShippingMethod;
use App\Models\Testimonial;
use App\Models\TestimonialPage;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $admin = Admin::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@store.com',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $customer = User::create([
            'name' => 'Customer User',
            'email' => 'customer@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $category = Category::create([
            'name' => 'Building Materials',
            'slug' => Str::slug('Building Materials'),
            'description' => 'High-quality building materials for residential and commercial construction.',
            'image' => 'https://example.com/images/categories/building-materials.jpg',
        ]);

        $subCategory = Category::create([
            'name' => 'WPC Panels',
            'slug' => Str::slug('WPC Panels'),
            'description' => 'Durable WPC panels for interiors and facades.',
            'image' => 'https://example.com/images/categories/wpc-panels.jpg',
            'parent_id' => $category->id,
            'sort_order' => 1,
        ]);

        $productA = Product::create([
            'name' => 'WPC Louver Panel 3D Charcoal',
            'slug' => 'wpc-louver-panel-3d-charcoal',
            'description' => 'A premium WPC louver panel with a charcoal finish for modern facade design.',
            'category_id' => $subCategory->id,
            'brand' => 'BuildMart',
            'price' => 1999.00,
            'sale_price' => 1799.00,
            'stock' => 120,
            'featured' => true,
            'special' => true,
            'trending' => true,
            'images' => [
                'https://example.com/images/products/wpc-panel-1.jpg',
                'https://example.com/images/products/wpc-panel-2.jpg',
            ],
            'tags' => ['wpc', 'panel', 'charcoal', 'facade'],
            'specifications' => [
                'material' => 'WPC',
                'size' => '1200x2400 mm',
                'thickness' => '8 mm',
                'color' => 'Charcoal',
            ],
        ]);

        $productB = Product::create([
            'name' => 'WPC Cladding Panel Natural',
            'slug' => 'wpc-cladding-panel-natural',
            'description' => 'Natural-tone WPC cladding panel for premium exterior finishes.',
            'category_id' => $subCategory->id,
            'brand' => 'BuildMart',
            'price' => 2199.00,
            'stock' => 90,
            'featured' => false,
            'special' => false,
            'trending' => true,
            'images' => [
                'https://example.com/images/products/wpc-cladding-1.jpg',
            ],
            'tags' => ['wpc', 'cladding', 'natural'],
            'specifications' => [
                'material' => 'WPC',
                'size' => '1200x2400 mm',
                'thickness' => '10 mm',
                'color' => 'Natural',
            ],
            'related_product_ids' => [$productA->id],
            'frequently_bought_together_ids' => [$productA->id],
        ]);

        $productA->update([
            'related_product_ids' => [$productB->id],
            'frequently_bought_together_ids' => [$productB->id],
        ]);

        Banner::create([
            'title' => 'Build Better with Build Mart',
            'subtitle' => 'Premium building materials, delivered fast.',
            'cta' => 'Shop Now',
            'link' => '/products',
            'gradient' => 'from-blue-500 to-cyan-500',
        ]);

        ShippingMethod::create([
            'name' => 'Standard Delivery',
            'price' => 199.00,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'WELCOME10',
            'type' => 'percent',
            'value' => 10,
            'is_active' => true,
        ]);

        Payment::create([
            'user_id' => $adminUser->id,
            'order_id' => 'order_1001',
            'payment_id' => 'pay_1001',
            'signature' => 'signature_1001',
            'amount' => 3198.00,
            'status' => 'paid',
            'payload' => [
                'method' => 'razorpay',
                'status' => 'paid',
            ],
        ]);

        Appointment::create([
            'email' => 'john.doe@example.com',
            'payload' => [
                'name' => 'John Doe',
                'phone' => '+91 9876543210',
                'date' => '2026-08-05',
                'time' => '11:00',
                'message' => 'I need a consultation on facade materials.',
            ],
            'is_active' => true,
        ]);

        Enquiry::create([
            'enquiry_number' => 'ENQ-20260722-0001',
            'user_id' => $customer->id,
            'type' => 'enquiry',
            'status' => 'processing',
            'contact' => [
                'name' => 'Customer User',
                'phone' => '+91 9876543211',
                'email' => 'customer@example.com',
            ],
            'items' => [
                [
                    'productId' => $productA->id,
                    'name' => $productA->name,
                    'quantity' => 20,
                    'price' => $productA->price,
                ],
            ],
            'amount_payable' => 35980.00,
            'store_credit_used' => 0,
            'status_history' => [
                [
                    'at' => now()->toISOString(),
                    'by' => 'Customer User',
                    'action' => 'Enquiry submitted',
                ],
            ],
        ]);

        Review::create([
            'product_id' => $productA->id,
            'user_id' => $customer->id,
            'rating' => 5,
            'title' => 'Excellent product',
            'body' => 'The WPC panel quality is impressive and installation was easy.',
            'status' => 'approved',
        ]);

        CartItem::create([
            'user_id' => $customer->id,
            'product_id' => $productB->id,
            'quantity' => 5,
        ]);

        Refund::create([]);
        WalletTransaction::create([]);
        Deal::create([]);
        HeroConfig::create([]);
        CareerDepartment::create([]);
        CareerRecruiter::create([]);
        CareerJob::create([]);
        CareerApplication::create([]);
        CareersPage::create([]);
        Testimonial::create([]);
        TestimonialPage::create([]);

        $this->call(MockApiSeeder::class);
    }
}
