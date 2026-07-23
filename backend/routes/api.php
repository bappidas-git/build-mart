<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\UserAddressController;
use App\Http\Controllers\ConfigController;
use App\Http\Controllers\EnquiryItemController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
// Change password route
Route::post('/change-password', [AuthController::class, 'changePassword']);
// Admin authentication (admins table, admin-scoped Sanctum token)
Route::post('/admin/auth/login', [AdminAuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/admin/auth/logout', [AdminAuthController::class, 'logout']);
    Route::apiResource('admins', AdminController::class);
    Route::apiResource('users.addresses', UserAddressController::class)->shallow();
    Route::apiResource('enquiries.items', EnquiryItemController::class)->shallow();
    Route::post('/payments/create-order', [PaymentController::class, 'createOrder']);
    Route::post('/payments/verify', [PaymentController::class, 'verifyPayment']);
    Route::get('/users/{id}/payments', [PaymentController::class, 'userPayments']);
    Route::apiResource('appointments', AppointmentController::class);
    Route::get('/appointments/email/{email}', [AppointmentController::class, 'getByEmail']);
});

// Settings singleton (whole-object read, section-level merge updates)
Route::get('/settings', [SettingController::class, 'show']);
Route::put('/settings', [SettingController::class, 'update']);
Route::patch('/settings', [SettingController::class, 'update']);
Route::patch('/settings/{section}', [SettingController::class, 'updateSection']);

// Lead capture convenience endpoints (contact form + newsletter signup)
Route::post('/leads/contact', [LeadController::class, 'storeContact']);
Route::post('/leads/newsletter', [LeadController::class, 'storeNewsletter']);

// Hero carousel + deals config singletons (mock-style, storefront, and admin paths)
foreach (['/heroConfig', '/hero/config', '/admin/hero/config'] as $heroPath) {
    Route::get($heroPath, [ConfigController::class, 'showHero']);
    Route::put($heroPath, [ConfigController::class, 'updateHero']);
    Route::patch($heroPath, [ConfigController::class, 'updateHero']);
}
foreach (['/dealsConfig', '/deals/config', '/admin/deals/config'] as $dealsPath) {
    Route::get($dealsPath, [ConfigController::class, 'showDeals']);
    Route::put($dealsPath, [ConfigController::class, 'updateDeals']);
    Route::patch($dealsPath, [ConfigController::class, 'updateDeals']);
}

// Careers + testimonials page singletons (mock-style, storefront, and admin paths)
foreach (['/careersPage', '/careers/page', '/admin/careers/page'] as $careersPath) {
    Route::get($careersPath, [ConfigController::class, 'showCareersPage']);
    Route::put($careersPath, [ConfigController::class, 'updateCareersPage']);
    Route::patch($careersPath, [ConfigController::class, 'updateCareersPage']);
}
foreach (['/testimonialsPage', '/testimonials/page', '/admin/testimonials/page'] as $testimonialsPath) {
    Route::get($testimonialsPath, [ConfigController::class, 'showTestimonialsPage']);
    Route::put($testimonialsPath, [ConfigController::class, 'updateTestimonialsPage']);
    Route::patch($testimonialsPath, [ConfigController::class, 'updateTestimonialsPage']);
}

// Storefront routes backed by real database tables
Route::get('/{resource}', [StorefrontController::class, 'index'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::post('/{resource}', [StorefrontController::class, 'store'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::get('/{resource}/slug/{slug}', [StorefrontController::class, 'showBySlug'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::get('/products/featured', [StorefrontController::class, 'featuredProducts']);
Route::get('/products/special', [StorefrontController::class, 'specialProducts']);
Route::get('/products/trending', [StorefrontController::class, 'trendingProducts']);
Route::get('/products/category/{categoryId}', [StorefrontController::class, 'productsByCategory']);
Route::get('/{resource}/{id}', [StorefrontController::class, 'show'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::put('/{resource}/{id}', [StorefrontController::class, 'update'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::patch('/{resource}/{id}', [StorefrontController::class, 'update'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::delete('/{resource}/{id}', [StorefrontController::class, 'destroy'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::post('/careers/uploads', [StorefrontController::class, 'uploadResume']);
