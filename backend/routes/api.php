<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MockApiController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
// Change password route
Route::post('/change-password', [AuthController::class, 'changePassword']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/payments/create-order', [PaymentController::class, 'createOrder']);
    Route::post('/payments/verify', [PaymentController::class, 'verifyPayment']);
    Route::get('/users/{id}/payments', [PaymentController::class, 'userPayments']);
    Route::apiResource('appointments', AppointmentController::class);
    Route::get('/appointments/email/{email}', [AppointmentController::class, 'getByEmail']);
});

// Mock API compatibility routes for the storefront UI
Route::get('/{resource}', [MockApiController::class, 'index'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::post('/{resource}', [MockApiController::class, 'store'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::get('/{resource}/slug/{slug}', [MockApiController::class, 'showBySlug'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::get('/products/featured', [MockApiController::class, 'featuredProducts']);
Route::get('/products/special', [MockApiController::class, 'specialProducts']);
Route::get('/products/trending', [MockApiController::class, 'trendingProducts']);
Route::get('/products/category/{categoryId}', [MockApiController::class, 'productsByCategory']);
Route::get('/{resource}/{id}', [MockApiController::class, 'show'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::put('/{resource}/{id}', [MockApiController::class, 'update'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::patch('/{resource}/{id}', [MockApiController::class, 'update'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::delete('/{resource}/{id}', [MockApiController::class, 'destroy'])->where('resource', '[a-zA-Z0-9_\\-]+');
Route::post('/careers/uploads', [MockApiController::class, 'uploadResume']);
