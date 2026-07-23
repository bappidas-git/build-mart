<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\StorefrontController;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
// Change password route
Route::post('/change-password', [AuthController::class, 'changePassword']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('admins', AdminController::class);
    Route::post('/payments/create-order', [PaymentController::class, 'createOrder']);
    Route::post('/payments/verify', [PaymentController::class, 'verifyPayment']);
    Route::get('/users/{id}/payments', [PaymentController::class, 'userPayments']);
    Route::apiResource('appointments', AppointmentController::class);
    Route::get('/appointments/email/{email}', [AppointmentController::class, 'getByEmail']);

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
});
