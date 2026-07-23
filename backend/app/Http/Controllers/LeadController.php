<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function storeContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'orderNumber' => 'nullable|string|max:40',
            'category' => 'nullable|string|max:30',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        $lead = Lead::create([
            'type' => 'contact',
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'order_number' => $validated['orderNumber'] ?? null,
            'category' => $validated['category'] ?? null,
            'subject' => $validated['subject'] ?? null,
            'message' => $validated['message'],
            'status' => 'new',
            'notes' => '',
        ]);

        return response()->json([
            'success' => true,
            'data' => $lead,
        ], 201);
    }

    public function storeNewsletter(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $lead = Lead::firstOrCreate(
            ['type' => 'newsletter', 'email' => $validated['email']],
            ['status' => 'subscribed', 'notes' => '']
        );

        return response()->json([
            'success' => true,
            'data' => $lead,
        ], 201);
    }
}
